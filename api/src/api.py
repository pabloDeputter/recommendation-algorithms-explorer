import ast
import datetime
import os
import pickle
import time

import bcrypt
from dateutil import parser as date_parser
from flask import request, json
from flask.json import jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_restful import Resource
from sqlalchemy import and_, func, desc, asc, text, between, distinct, case, tuple_
from werkzeug.utils import secure_filename

from . import app, parser, db, api, models, DISABLE_AUTH, r
from .models import Datasets, DatasetsData, Topk, UserMetadata, ItemMetadata, Tests, has_algorithm, Algorithms, CTR, \
    CTR_7, CTR_30, Users
from .tasks import run_test, upload_datasets
from .utils import to_dict, daterange
from itertools import zip_longest

if not app.debug:
    @app.route('/')
    def index():
        return app.send_static_file('index.html')


    @app.errorhandler(404)
    def not_found(e):
        return app.send_static_file('index.html')

parser.add_argument('data', type=dict, location='json', required=True)

'''
###############    TESTS    ###############
'''


@app.route("/api/tests/<string:dataset_name>/<int:test_id>")
def get_tests_data(dataset_name, test_id):
    bounds = db.session.execute(text(
        f'SELECT * FROM tests WHERE dataset_name=\'{dataset_name}\' and id=\'{test_id}\';'
    ))
    return jsonify(to_dict(bounds))


@app.route("/api/tests/<int:test_id>/eta_duration")
@jwt_required(optional=DISABLE_AUTH)
def get_eta_duration(test_id):
    value = r.get("average_alg_time_" + str(test_id))
    if value is None:
        return jsonify(value)
    return jsonify(eval(value))


@app.route('/api/date_boundaries/<string:dataset>', methods=['GET'])
def get_date_boundaries(dataset):
    bounds = db.session.execute(text(
        f'SELECT MIN(purchase_date) AS lbound, MAX(purchase_date) AS rbound FROM datasets_data WHERE dataset_name=\'{dataset}\';'
    ))
    return jsonify(to_dict(bounds))


@app.route('/api/tests/<int:test_id>/ctr/<string:algorithm_id>', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_ctr(test_id, algorithm_id):
    """
    GET request
    Click Through Rate (CTR)
        Deze metriek vertegenwoordigt hoe vaak gebruikers één van hun aanbeveling
        consumeren. Per top-k lijst heb je een CTR van 1 als de gebruiker op een
        recommendation klikt (het item koopt in dit geval) en anders 0. De CTR neemt
        het gemiddelde over alle aanbevelingen per tijdstap.

    :param test_id: test id
    :param algorithm_id: algorithm id
    :return: {"ctr": {"purchase_date": date, "ctr": float(0-1)}}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    user_id = request.args.get('user_id')
    item_id = request.args.get('item_id')
    algorithm_id = int(algorithm_id)

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    dataset_name = Tests.query.with_entities(Tests.dataset_name).where(Tests.id == test_id).scalar()

    if user_id:
        tup = tuple_(DatasetsData.id, test_id, algorithm_id, user_id)
        entities = (CTR.transaction_id, CTR.test_id, CTR.algorithm, CTR.user_id)

        ctr_subq1 = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                     func.sum(distinct(case([
                                                         (tup.in_(
                                                             CTR.query.with_entities(*entities)
                                                                 .subquery()), 1)],
                                                         else_=0))).label("ctr")) \
            .filter(between(DatasetsData.purchase_date, start_date, end_date)).group_by(
            DatasetsData.purchase_date)
        return jsonify({'ctr': to_dict(ctr_subq1.all())})
    else:
        tup = tuple_(DatasetsData.id, test_id, algorithm_id)
        entities = (CTR.transaction_id, CTR.test_id, CTR.algorithm)

    ctr_subq1 = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                 func.sum(case([
                                                     (tup.in_(
                                                         CTR.query.with_entities(*entities)
                                                             .subquery()), 1)],
                                                     else_=0)).label("success")) \
        .filter(between(DatasetsData.purchase_date, start_date, end_date)).group_by(
        DatasetsData.purchase_date)


    ctr_subq2 = DatasetsData.query.with_entities(distinct(DatasetsData.purchase_date).label("purchase_date"),
                                                 func.sum(DatasetsData.id).label("total")).where(
        DatasetsData.dataset_name == dataset_name).group_by(DatasetsData.purchase_date)

    ctr = db.session.execute(text(f"""
    select purchase_date, (success / coalesce(total, 1)::FLOAT) as ctr from 
    ({ctr_subq1.statement.compile(compile_kwargs={"literal_binds": True})}) as T1
    natural join 
    ({ctr_subq2.statement.compile(compile_kwargs={"literal_binds": True})}) as T2
    order by purchase_date
    """))

    return jsonify({'ctr': to_dict(ctr)})


@app.route('/api/tests/<string:dataset_name>/<int:test_id>/algorithms', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_algorithms_tests(dataset_name, test_id):
    """
    Get algorithms for given test

    :param test_id: The test to query algorithms from
    :param dataset_name: The name of the dataset to query
    :return: JSON object:
    {
        "algorithms": [
            {
                "name": "popularity",
                "parameters": null,
                "test_id": 1
            }
        ]
    }
    """
    algorithms_sql = text(
        'SELECT H.test_id,\n' +
        '       A.name,\n' +
        '       A.parameters\n,' +
        '       H.algorithm_id\n' +
        'FROM Has_algorithm H\n' +
        'JOIN algorithms A ON H.algorithm_id = A.id\n' +
        f'WHERE H.test_id = {test_id}::INTEGER')
    algorithms = db.engine.execute(algorithms_sql)
    return jsonify({'algorithms': to_dict(algorithms)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/k_items', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_k_bought_items(dataset_name: str, test_id: int):
    """
    GET request
    :param dataset_name: the name of the dataset
    :param test_id: int
    :return: a json containing the topk bought items {'topk_items': ...}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    k = request.args.get('k')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if k is None:
        return {"msg": "K cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    topk_bought_items = DatasetsData.query.with_entities(DatasetsData.item_id,
                                                         func.count(DatasetsData.item_id).label("quantity")).filter(
        DatasetsData.dataset_name == dataset_name, DatasetsData.purchase_date >= start_date,
        DatasetsData.purchase_date <= end_date).group_by(DatasetsData.item_id).order_by(desc("quantity")).limit(k).all()

    return jsonify({'topk_items': to_dict(topk_bought_items)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/k_recommendations', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_k_recommended_items(dataset_name: str, test_id: int):
    """
    GET request
    :param dataset_name: name of the dataset
    :param test_id: int
    :return: a json containing the topk recommended items
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    k = request.args.get('k')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if k is None:
        return {"msg": "K cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)
    subq1 = Topk.query.with_entities(Algorithms.id.label("id"), Algorithms.name.label("algorithm"), Topk.item_id,
                                     func.count(Topk.item_id).label("quantity")).filter(
        Algorithms.id == Topk.algorithm,
        Topk.test_id == Tests.id,
        Tests.dataset_name == dataset_name,
        Topk.test_id == test_id,
        Topk.day >= start_date, Topk.day <= end_date) \
        .group_by(Algorithms.id, Algorithms.name, Topk.item_id).subquery()
    subq2 = db.session.query(subq1).with_entities(subq1.c.id, subq1.c.algorithm, subq1.c.item_id, subq1.c.quantity,
                                                  func.row_number().over(order_by=subq1.c.quantity.desc(),
                                                                         partition_by=subq1.c.id).label(
                                                      "rank")).subquery()
    topk_recommended_items = db.session.query(subq2).where(subq2.c.rank <= k).all()

    return jsonify({'topk_recommendations': to_dict(topk_recommended_items)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/active_users', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_active_users(dataset_name, test_id):
    """
    GET request
    :param dataset_name: str the name of the dataset
    :param test_id: int
    :return: json {'active_users': ...}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    # start_date = date_parser.parse(start_date)
    # end_date = date_parser.parse(end_date)
    # # Get active users, users who bought something in the given period
    #
    # active_users = DatasetsData.query.with_entities(DatasetsData.user_id,
    #                                                 func.count(DatasetsData.item_id).filter(
    #                                                     DatasetsData.purchase_date.between(start_date, end_date)).label(
    #                                                     "bought_interval"),
    #                                                 func.count(DatasetsData.item_id).label("bought_total")). \
    #     where(DatasetsData.dataset_name == dataset_name).group_by(DatasetsData.user_id).all()

    active_users = db.engine.execute(text(f"""
        SELECT user_id, bought_interval, bought_total FROM (
         SELECT user_id, COUNT(item_id) bought_interval
         FROM datasets_data
         WHERE dataset_name = '{dataset_name}'
           AND purchase_date BETWEEN '{start_date}'::DATE AND '{end_date}'::DATE
         GROUP BY user_id
     ) as interval NATURAL JOIN (
         SELECT user_id, COUNT(item_id) bought_total
         FROM datasets_data
         WHERE dataset_name='{dataset_name}'
         GROUP BY user_id) as total;
    """))

    return jsonify({'active_users': to_dict(active_users)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/active_users_count', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_active_users_count(dataset_name, test_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    k = request.args.get('k')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if k is None:
        return {"msg": "K cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # Get active users count
    active_users_count_sql = text(
        f'SELECT COUNT(DISTINCT user_id) as active FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and name = \'{dataset_name}\' AND purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\';')
    active_users_count = db.engine.execute(active_users_count_sql)
    active_users_count = [dict(row) for row in active_users_count][0]

    return jsonify({
        "active_users_count": active_users_count
    })


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/active_users', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_active_users(dataset_name, test_id):
    # Get active users, users who bought something in the given period
    active_users = get_tests_active_users(dataset_name, test_id).json['active_users']

    return jsonify({
        "active_users": active_users
    })


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/active_users_per_day', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_active_users_per_day(dataset_name, test_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # Get active users per day in given period
    active_users_per_day_sql = text(
        f'SELECT purchase_date, COUNT(DISTINCT user_id) as active FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\' AND name = \'{dataset_name}\' GROUP BY purchase_date ORDER BY purchase_date;')
    active_users_per_day = db.engine.execute(active_users_per_day_sql)

    return jsonify({'active_users_per_day': to_dict(active_users_per_day)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/revenue_per_day', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_revenue_per_day(dataset_name, test_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # # Get revenue per day inside period
    revenue_per_day = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                       func.sum(DatasetsData.price).label('revenue')).distinct(
        DatasetsData.purchase_date).filter(
        and_(DatasetsData.dataset_name == dataset_name, DatasetsData.purchase_date <= end_date,
             DatasetsData.purchase_date >= start_date)
    ).group_by(DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date)).all()

    return jsonify({'revenue_per_day': to_dict(revenue_per_day)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/topk_items', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_topk_items(dataset_name, test_id):
    return jsonify({'topk_items': get_tests_k_bought_items(dataset_name, test_id).json['topk_items']})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/topk_recommendations', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_topk_recommendations(dataset_name, test_id):
    return jsonify(
        {'topk_recommendations': get_tests_k_recommended_items(dataset_name, test_id).json['topk_recommendations']})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/purchases', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_purchases(dataset_name, test_id):
    return jsonify({'purchases': get_purchases(dataset_name).json['purchases']})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info/total_bought_per_day', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info_total_bought_per_day(dataset_name, test_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # Get total bought per day inside period
    bought_per_day_sql = text(
        f'SELECT purchase_date, COUNT(user_id) as bought FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\' AND name = \'{dataset_name}\' GROUP BY purchase_date ORDER BY purchase_date;')
    bought_per_day = db.engine.execute(bought_per_day_sql)

    return jsonify({'total_bought_per_day': to_dict(bought_per_day)})


@app.route('/api/<string:dataset_name>/tests/<int:test_id>/info', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_info(dataset_name, test_id):
    """
    GET request
    :param dataset_name: str name of the dataset
    :param test_id: int
    :return: json {'info': {
        'active_users_count': int,
        'active_users': list,
        'active_users_per_day': dict,
        'revenue': int,
        'revenue_per_day': dict,
        'topk_items': list,
        'topk_recommendations': list,
        'purchases': list
        'total_bought_per_day': dict,
    }}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    k = request.args.get('k')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if k is None:
        return {"msg": "K cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # Get active users, users who bought something in the given period
    active_users = get_tests_active_users(dataset_name, test_id).json['active_users']

    # Get active users count
    active_users_count_sql = text(
        f'SELECT COUNT(DISTINCT user_id) as active FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and name = \'{dataset_name}\' AND purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\';')
    active_users_count = db.engine.execute(active_users_count_sql)
    active_users_count = [dict(row) for row in active_users_count][0]

    # Get active users per day in given period
    active_users_per_day_sql = text(
        f'SELECT purchase_date, COUNT(DISTINCT user_id) as active FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\' AND name = \'{dataset_name}\' GROUP BY purchase_date ORDER BY purchase_date;')
    active_users_per_day = db.engine.execute(active_users_per_day_sql)

    # Get total revenue in given period
    revenue_sql = text(
        f'SELECT SUM(price) as revenue FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and name = \'{dataset_name}\' AND purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\';')
    revenue = db.engine.execute(revenue_sql)
    revenue = [dict(row) for row in revenue][0]
    # # Get revenue per day inside period
    revenue_per_day = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                       func.sum(DatasetsData.price).label('revenue')).distinct(
        DatasetsData.purchase_date).filter(
        and_(DatasetsData.dataset_name == dataset_name, DatasetsData.purchase_date <= end_date,
             DatasetsData.purchase_date >= start_date)
    ).group_by(DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date)).all()

    # Get total bought per day inside period
    bought_per_day_sql = text(
        f'SELECT purchase_date, COUNT(user_id) as bought FROM datasets_data as DD, datasets as D WHERE DD.dataset_name = D.name and purchase_date <= \'{end_date}\' AND purchase_date >= \'{start_date}\' AND name = \'{dataset_name}\' GROUP BY purchase_date ORDER BY purchase_date;')
    bought_per_day = db.engine.execute(bought_per_day_sql)

    # Get the k-top most bought items
    topk_items = get_tests_k_bought_items(dataset_name, test_id).json['topk_items']
    # Get the k-top most recommended items
    topk_recommendations = get_tests_k_recommended_items(dataset_name, test_id).json['topk_recommendations']

    return jsonify({'info': {
        'active_users_count': active_users_count,
        'active_users': active_users,
        'active_users_per_day': to_dict(active_users_per_day),
        'revenue': revenue,
        'revenue_per_day': to_dict(revenue_per_day),
        'topk_items': topk_items,
        'topk_recommendations': topk_recommendations,
        'purchases': get_purchases(dataset_name).json['purchases'],
        'total_bought_per_day': to_dict(bought_per_day)
    }})


@app.route("/api/tests/<int:test_id>/algorithms", methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_algorithms(test_id):
    subq1 = db.session.query(has_algorithm.c.algorithm_id).where(has_algorithm.c.test_id == test_id)
    algorithms = Algorithms.query.with_entities(Algorithms.id, Algorithms.name, Algorithms.parameters).where(
        Algorithms.id.in_(subq1)).all()
    return jsonify({"data": {"list": to_dict(algorithms)}})


'''
###############    METRICS    ###############
'''


@app.route('/api/<string:name>/metrics/purchases', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_purchases(name):
    """
    GET request
    :param name: datasetname
    :return: json {'purchases': dict}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    purchases = DatasetsData.query.with_entities(DatasetsData.purchase_date, DatasetsData.price).filter(
        and_(DatasetsData.purchase_date <= end_date, DatasetsData.purchase_date >= start_date,
             DatasetsData.dataset_name == name)
    ).group_by(DatasetsData.purchase_date, DatasetsData.price)

    return jsonify({'purchases': to_dict(purchases.all())})


@app.route('/api/<string:name>/metrics/purchases/<int:user_id_>', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_purchases_user(name, user_id_):
    """
    GET request
    :param name: str dataset name
    :param user_id_: int
    :return: json {'purchases': list}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    purchases = DatasetsData.query.with_entities(DatasetsData.purchase_date, DatasetsData.price).filter(
        and_(DatasetsData.purchase_date <= end_date, DatasetsData.purchase_date >= start_date,
             DatasetsData.dataset_name == name,
             DatasetsData.user_id == user_id_)
    ).group_by(DatasetsData.purchase_date, DatasetsData.price).all()

    response = []
    for row in purchases:
        response.append(list(row))
    return jsonify({'purchases': response})


@app.route('/api/<string:name>/metrics/active_users', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_active_users(name):
    """
    GET request
    :param name: str dataset name
    :return: json {'active_users': list}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    active_users = DatasetsData.query.with_entities(DatasetsData.user_id).distinct().filter(
        and_(DatasetsData.purchase_date <= end_date, DatasetsData.purchase_date >= start_date,
             DatasetsData.dataset_name == name)
    ).count()

    return jsonify({'active_users': active_users})


@app.route('/api/<int:test_id>/metrics/ard/<int:algorithm>', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_ard(test_id, algorithm):
    """
    GET request
    Attribution Rate (AR@D)
        De attribution rate is een meer tolerante versie van conversion rate. Hier wordt
        een aankoop toegekend aan het recommendation algoritme als een aanbeveling
        van het item in de voorbije D dagen plaatsvond. Wanneer je alle toegekende
        aankopen deelt door het totaal aantal aankopen per tijdstip, krijg je de attribution
        rate. Deze metriek berekent dus het aandeel van de aankopen dat dankzij het
        recommendation algoritme gebeurd is. Voor het project mogen twee instanties
        hiervan voorzien worden met D hardcoded op 7 en op 30.
    :param test_id: int id van een test
    :param algorithm: int id of an algorithm
    :return: ard
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    D = request.args.get('D')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if int(D) not in (7, 30):
        return {"msg": f"D must be 7 or 30 not {D}!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    CTR_ = CTR_7 if D == 7 else CTR_30

    dataset_name = Tests.query.with_entities(Tests.dataset_name).where(Tests.id == test_id).scalar()

    ctr_subq1 = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                 func.sum(case([
                                                     (tuple_(DatasetsData.id, test_id, algorithm).in_(
                                                         CTR_.query.with_entities(CTR_.transaction_id, CTR_.test_id,
                                                                                  CTR_.algorithm)
                                                             .subquery()), 1)],
                                                     else_=0)).label("success")) \
        .filter(between(DatasetsData.purchase_date, start_date, end_date)).group_by(
        DatasetsData.purchase_date)

    ctr_subq2 = DatasetsData.query.with_entities(distinct(DatasetsData.purchase_date).label("purchase_date"),
                                                 func.sum(DatasetsData.id).label("total")).where(
        DatasetsData.dataset_name == dataset_name).group_by(DatasetsData.purchase_date)

    ard = db.session.execute(text(f"""
    select purchase_date, (success / coalesce(total, 1)::FLOAT) as ard from 
    ({ctr_subq1.statement.compile(compile_kwargs={"literal_binds": True})}) as T1
    natural join 
    ({ctr_subq2.statement.compile(compile_kwargs={"literal_binds": True})}) as T2
    order by purchase_date
    """))

    return jsonify({'ard': to_dict(ard)})


@app.route('/api/<int:test_id>/metrics/arpu/<int:algorithm>', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_arpu(test_id, algorithm):
    """
    GET request
     Average Revenue Per User (ARPU@D)
        Aangezien van elke aankoop ook de prijs gekend is, kan de omzet die toe te
        kennen is aan het algoritme ook berekend worden. Gebruik hiervoor het idee van
        AR@D, maar in plaats van 1 of 0, tel je de prijs van de aankopen op.
    :param test_id: int test id
    :param algorithm: int id of an algorithm
    :return: json {'arpu': {"date": float}}
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    D = request.args.get('D')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    if int(D) not in (7, 30):
        return {"msg": f"D can be 7 or 30 but is {D}!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    CTR_ = CTR_7 if D == 7 else CTR_30

    dataset_name = Tests.query.with_entities(Tests.dataset_name).where(Tests.id == test_id).scalar()

    ctr_subq1 = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                 func.sum(case([
                                                     (tuple_(DatasetsData.id, test_id, algorithm).in_(
                                                         CTR_.query.with_entities(CTR_.transaction_id, CTR_.test_id,
                                                                                  CTR_.algorithm)
                                                             .subquery()), DatasetsData.price)],
                                                     else_=0)).label("success")) \
        .filter(between(DatasetsData.purchase_date, start_date, end_date)).group_by(
        DatasetsData.purchase_date)

    ctr_subq2 = DatasetsData.query.with_entities(distinct(DatasetsData.purchase_date).label("purchase_date"),
                                                 func.sum(DatasetsData.id).label("total")).where(
        DatasetsData.dataset_name == dataset_name).group_by(DatasetsData.purchase_date)

    arpu = db.session.execute(text(f"""
        select purchase_date, (success / coalesce(total, 1)::FLOAT) as arpu from 
        ({ctr_subq1.statement.compile(compile_kwargs={"literal_binds": True})}) as T1
        natural join 
        ({ctr_subq2.statement.compile(compile_kwargs={"literal_binds": True})}) as T2
        order by purchase_date
        """))

    return jsonify({'arpu': to_dict(arpu)})


'''
###############    DATASETS    ###############
'''


@app.route('/api/delete_dataset/<string:dataset>', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def delete_dataset(dataset):
    if not Datasets.query.filter_by(name=dataset).first():
        return jsonify(code=400, msg='Dataset doesn\'t exist!'), 400
    r.set(dataset + "_deleting", "true")
    db.engine.execute(f'DELETE FROM datasets WHERE name=\'{dataset}\'')
    r.delete(dataset + "_deleting")
    return jsonify(code=200, msg='Dataset successfully removed!'), 200


@app.route('/api/metadata/<string:dataset>/<string:metadata_type>', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_metadata(dataset, metadata_type):
    begin = int(request.args.get('begin'))
    end = int(request.args.get('end'))
    if metadata_type == "users":
        users = db.engine.execute(text(f"""
        SELECT user_metadata FROM
            (SELECT user_metadata,
                row_number() over (ORDER BY id) AS index
            FROM user_metadata WHERE dataset_name='{dataset}') AS indexed
        WHERE index BETWEEN {begin} AND {end}
        """))
        return jsonify([ast.literal_eval(item["user_metadata"]) for item in to_dict(users)])
    elif metadata_type == "items":
        users = db.engine.execute(text(f"""
        SELECT item_metadata FROM
            (SELECT item_metadata,
                row_number() over (ORDER BY id) AS index
            FROM item_metadata WHERE dataset_name='{dataset}') AS indexed
        WHERE index BETWEEN {begin} AND {end}
        """))
        return jsonify([ast.literal_eval(item["item_metadata"]) for item in to_dict(users)])


@app.route('/api/datasets/<string:dataset_name>/tests', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_tests_datasets(dataset_name):
    """
    Get all the tests that were executed on current dataset with data that
    can be found below in :return:

    :param dataset_name: The name of the dataset to query
    :return: JSON object:
    {
    "tests": [
        {
            "begin": "Wed, 01 Jan 2020 00:00:00 GMT",
            "end": "Wed, 01 Jan 2020 00:00:00 GMT",
            "id": 1,
            "name": "popularity",
            "parameters": null,
            "step_size": 1
        }
    ]
    }
    """
    tests_sql = text(
        'SELECT DISTINCT ON (T.id)\n' +
        '                   T.id,\n' +
        '                   T.begin,\n' +
        '                   T.end,\n' +
        '                   T.step_size\n' +
        'FROM Tests T\n' +
        'INNER JOIN Has_algorithm H ON T.id = H.test_id\n' +
        f'WHERE T.dataset_name = \'{str(dataset_name)}\'' +
        '\n' +
        'ORDER BY T.id ASC')
    tests = to_dict(db.engine.execute(tests_sql))
    for i in tests:
        i['algorithms'] = get_algorithms_tests(dataset_name, i['id']).json['algorithms']

    return jsonify({'tests': tests})


@app.route('/api/get_datasets_info', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_datasets():
    """
    GET request
    :return: json {'datasets': list}
    """
    datasets = Datasets.query.with_entities(Datasets.name).all()
    response = []
    uploading = []
    for row in datasets:
        if r.exists(row.name + "_uploading") or r.exists(row.name + "_deleting"):
            uploading.append(row.name)
            continue
        counts = Datasets.query.with_entities(Datasets.user_count, Datasets.item_count).filter(
            Datasets.name == row.name).first()
        dataset = {'name': row.name,
                   'users': counts[0],
                   'items': counts[1]}
        response.append(dataset)
    return jsonify({'datasets': response, 'uploading': uploading})


@app.route('/api/<string:name>/overview/tables', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_info_dataset_page_tables(name):
    # Get users
    users = UserMetadata.query.with_entities(UserMetadata.id).filter(UserMetadata.dataset_name == name).count()
    user_types = DatasetsData.query.with_entities(Datasets.users_types).filter(Datasets.name == name).first()
    # Get items
    items = ItemMetadata.query.with_entities(ItemMetadata.id).filter(ItemMetadata.dataset_name == name).count()
    item_types = DatasetsData.query.with_entities(Datasets.items_types).filter(Datasets.name == name).first()
    # Get description
    description = Datasets.query.with_entities(Datasets.description).filter(Datasets.name == name).first()
    # Return as JSON
    return jsonify({
        'users_count': users,
        'user_types': json.loads(user_types[0]),
        'item_types': json.loads(item_types[0]),
        'items_count': items,
        'description': str(description[0])
    })


@app.route('/api/<string:name>/overview/statistics', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_info_dataset_page_statistics(name):
    """
    GET request
    :param name: dataset name
    :return: json {'users': list,
                    'users_count': int,
                    'items': list,
                    'items_count': int,
                    'spend_per_day': dict,
                    'bought_per_day': dict
                    'description': str}
    """
    # Get users
    users = UserMetadata.query.with_entities(UserMetadata.id).filter(UserMetadata.dataset_name == name).count()
    # Get items
    items = ItemMetadata.query.with_entities(ItemMetadata.id).filter(ItemMetadata.dataset_name == name).count()
    # Get spend per day
    spend_per_day = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                     func.sum(DatasetsData.price).label('revenue')).filter(
        DatasetsData.dataset_name == name
    ).group_by(DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date)).all()
    # Get times bought per day
    bought_per_day = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                      func.count(DatasetsData.purchase_date).label('bought')).filter(
        DatasetsData.dataset_name == name
    ).group_by(DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date)).all()
    return jsonify({'users_count': users,  # .count(),
                    'items_count': items,  # .count(),
                    'spend_per_day': to_dict(spend_per_day),
                    'bought_per_day': to_dict(bought_per_day)})


@app.route('/api/dataset', methods=['POST'])
@jwt_required(optional=DISABLE_AUTH)
def post_dataset_data():
    """
    This method adds a new entry to the datasets table and adds the data of the dataset to datasets_data.
    It also uploads the metadata values to item_metadata and user_metadata and populates the items_day_count
    and recency table. These preprocessing tables allow A/B tests to be created much faster.

    The request should have the following files and values:
    dataset_name: name of the dataset
    dataset_description: description of the dataset
    dataset_columns: mappings for the date, user_id, item_id and price column
    user_pk: the column that represents the user_id in the user metadata
    item_pk: the column that represents the item_id in the item metadata
    item_name_column: the column that represents the item name in the item metadata
    user_types: a dictionary with user metadata columns as key and their data type they hold as value
    item_types: a dictionary with item metadata columns as key and their data type they hold as value
    data: dataset CSV file
    user_data: user metadata CSV file
    item_data: item metadata CSV file

    :return: Status code 200 if the dataset has been uploaded succesfully
    """
    # Load dataset name from the request
    dataset_name = request.values['dataset_name']
    # Check if dataset already exists
    if Datasets.query.filter(Datasets.name == dataset_name).first():
        return jsonify(code=418, msg='A dataset with this name already exists!'), 418
    # Set upload state
    r.set(dataset_name + "_uploading", "True")
    # Temporarily save the CSV files so they can be loaded using polars and celery
    file_paths = dict()
    for fid, file in [(fid, request.files[fid]) for fid in ("data", "user_data", "item_data") if fid in request.files]:
        filename = secure_filename(file.filename)
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)
        file_paths[fid] = path

    user_types = {}
    if "user_data" in file_paths:
        user_pk = request.values['user_pk']
        user_types = json.loads(request.values['user_types'])
        # user_types['user_id'] = user_types[user_pk]
        del user_types[user_pk]
    item_types = {}
    if "item_data" in file_paths:
        item_pk = request.values['item_pk']
        item_name_column = request.values['item_name_column']
        item_types = json.loads(request.values['item_types'])
        # item_types['item_id'] = item_types[item_pk]
        del item_types[item_pk]
        # item_types['name'] = item_types[item_name_column]
        del item_types[item_name_column]

    # Add an entry to the main Dataset table
    db.session.add(Datasets(
        name=dataset_name,
        description=request.values['dataset_description'],
        users_types=json.dumps(user_types),  # str(request.values['user_types']),
        items_name=request.values['item_name_column'],
        items_types=json.dumps(item_types)  # str(request.values['item_types'])
    ))
    db.session.commit()

    # Let the datasets upload in the background
    upload_datasets.delay(
        pickle.dumps(file_paths),
        pickle.dumps(dataset_name),
        pickle.dumps(request.values['dataset_columns'].replace("\\r", "")),  # fix obscure bug
        pickle.dumps(request.values['user_pk']),
        pickle.dumps(request.values['item_pk']),
        pickle.dumps(request.values['item_name_column'])
    )
    return jsonify(code=200, msg='Upload successful'), 200


'''
###############    ITEMS    ###############
'''


@app.route('/api/items/<string:dataset_name>/<int:item_id>/dates', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_dates_items(dataset_name, item_id):
    """
    Get first and last purchase made by user for item

    :param dataset_name: The name of the dataset to query
    :param item_id: The id of the item you want to know the dates for
    :return: JSON object:
    {
        "first_purchase": "Wed, 01 Jan 2020 00:00:00 GMT",
        "last_purchase": "Wed, 01 Jan 2020 00:00:00 GMT"
    }
    """
    purchases = DatasetsData.query.with_entities(func.min(DatasetsData.purchase_date),
                                                 func.max(DatasetsData.purchase_date)).distinct() \
        .filter(DatasetsData.dataset_name == dataset_name, DatasetsData.item_id == item_id) \
        .group_by(DatasetsData.purchase_date).all()

    response = jsonify({'first_purchase': purchases[0][0],
                        'last_purchase': purchases[len(purchases) - 1][1]})
    return response


@app.route('/api/items/<string:dataset_name>/<int:item_id>/recommendations_successful', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_recommendations_successful_items(dataset_name, item_id):
    algorithm_id = request.args.get('algorithm_id')
    test_id = request.args.get('test_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if algorithm_id is None:
        return {"msg": "algorithm_id cannot be None!"}, 400
    if test_id is None:
        return {"msg": "test_id cannot be None!"}, 400

    sql_text = text(f"""
    SELECT T.day, COUNT(T.day) as quantity
    FROM   topk T
    WHERE  T.day >= '{start_date}'
           AND T.day <= '{end_date}'
           AND T.item_id = {item_id}
           AND T.test_id = {test_id}
           AND T.algorithm = {algorithm_id}
           AND EXISTS (SELECT *
                       FROM   datasets_data D
                       WHERE  D.purchase_date >= '{start_date}'
                              AND D.purchase_date <= '{end_date}'
                              AND D.item_id = {item_id}
                              AND D.dataset_name = '{dataset_name}'
                              AND T.user_id = D.user_id)  
    GROUP BY T.day
    ORDER BY T.day ASC
    """
                    )

    successful_recommendations = db.engine.execute(sql_text)

    return jsonify({'recommendationss:': to_dict(successful_recommendations)})


# @app.route('/api/items/<string:dataset_name>/<int:item_id>/recommendations_ratio', methods=['GET'])
# @jwt_required(optional=DISABLE_AUTH)
# def get_recommendations_ratio_items(dataset_name, item_id):
#     algorithm_id = request.args.get('algorithm_id')
#     test_id = request.args.get('test_id')
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#
#     if start_date is None:
#         return {"msg": "Start date cannot be None!"}, 400
#     if end_date is None:
#         return {"msg": "End date cannot be None!"}, 400
#     if algorithm_id is None:
#         return {"msg": "algorithm_id cannot be None!"}, 400
#     if test_id is None:
#         return {"msg": "test_id cannot be None!"}, 400
#
#     sql_text = text(f"""
#     SELECT T.day,
#            Count (T.day) / (SELECT Count(*)
#                             FROM   topk A
#                             WHERE  A.day >= '{start_date}'
#                                    AND A.day <= '{end_date}'
#                                    AND A.item_id = {item_id}
#                                    AND A.test_id = {test_id}) :: FLOAT AS success
#                                    AND A.algorithm = {algorithm_id}
#     FROM   topk T
#     WHERE  T.day >= '{start_date}'
#            AND T.day <= '{end_date}'
#            AND T.item_id = {item_id}
#            AND T.test_id = {test_id}
#            AND T.algorithm = {algorithm_id}
#            AND EXISTS (SELECT *
#                        FROM   datasets_data D
#                        WHERE  D.purchase_date >= '{start_date}'
#                               AND D.purchase_date <= '{end_date}'
#                               AND D.item_id = {item_id}
#                               AND D.dataset_name = '{dataset_name}'
#                               AND T.user_id = D.user_id)
#     GROUP BY T.day
#     ORDER BY T.day ASC
#     """
#                     )
#
#     recommendations_ratio = db.engine.execute(sql_text)
#
#     return jsonify({'recommendations_ratio:': to_dict(recommendations_ratio)})

def fill_empty_dates(start_date, end_date, delta, listo):
    for index, data in enumerate(zip_longest(listo, list(daterange(start_date, end_date, delta.days)))):
        x, date = data
        if x is None or x['day'] != date.date():
            listo.insert(index, {
                'day': date.date(),
                'quantity': 0
            })
            continue
    return listo

@app.route('/api/items/<string:dataset_name>/<int:item_id>/recommendations', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_recommendations_items(dataset_name, item_id):
    """
    Get times it was recommended by an algorithm over time

    :param dataset_name: The name of the dataset to query
    :param item_id: The id of the item
    :return: JSON object:
    {
        "recommendations": [
            {
                "day": "Thu, 02 Jan 2020 00:00:00 GMT",
                "quantity": 13836
            }
        ]
    }
    """
    algorithm_id = request.args.get('algorithm_id')
    test_id = request.args.get('test_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    step_size = request.args.get('step_size')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400
    if algorithm_id is None:
        return {"msg": "algorithm_id cannot be None!"}, 400
    if test_id is None:
        return {"msg": "test_id cannot be None!"}, 400
    if step_size is None:
        return {"msg": "step_size cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # Get total times an item was recommended by an algorithm over period
    sql = text(f"""
    SELECT topk.day AS day, count(topk.item_id) AS quantity 
    FROM topk 
    WHERE topk.day <= '{end_date}' AND topk.day >= '{start_date}' AND topk.item_id = {item_id} AND topk.test_id = {test_id}
    AND topk.algorithm = {algorithm_id} GROUP BY topk.item_id, topk.day
    ORDER BY topk.day ASC    
    """)
    recommended = to_dict(db.engine.execute(sql))

    sql_text = text(f"""
    SELECT T.day AS DAY,
           COUNT(T.day) AS quantity
    FROM topk T
    JOIN datasets_data D ON T.user_id = D.user_id
    AND T.item_id = D.item_id
    AND T.day = D.purchase_date
    AND D.dataset_name = '{dataset_name}'
    AND D.purchase_date >= '{start_date}'
    AND D.purchase_date <= '{end_date}'
    AND T.algorithm = {algorithm_id}
    AND T.Test_id = {test_id}
    AND T.item_id = {item_id}
    GROUP BY T.day
    ORDER BY T.day ASC
    """
                    )
    successful_recommendations = to_dict(db.engine.execute(sql_text))


    delta = datetime.timedelta(days=int(step_size))

    return jsonify({'recommendations': fill_empty_dates(start_date, end_date, delta, recommended),
                    'successful_recommendations': fill_empty_dates(start_date, end_date, delta, successful_recommendations)})


@app.route('/api/items/<string:dataset_name>/<int:item_id>/info', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_item_info(dataset_name, item_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if start_date is None:
        return {"msg": "Start date cannot be None!"}, 400
    if end_date is None:
        return {"msg": "End date cannot be None!"}, 400

    start_date = date_parser.parse(start_date)
    end_date = date_parser.parse(end_date)

    # Get total times it was bought over interval
    purchases = DatasetsData.query.with_entities(DatasetsData.purchase_date, DatasetsData.price,
                                                 DatasetsData.user_id).filter(
        and_(DatasetsData.purchase_date <= end_date, DatasetsData.purchase_date >= start_date,
             DatasetsData.dataset_name == dataset_name,
             DatasetsData.item_id == item_id)
    )
    purchases_table = purchases.all()
    purchases_graph = purchases.with_entities(DatasetsData.purchase_date,
                                              func.count(DatasetsData.purchase_date).label(
                                                  'quantity')).group_by(
        DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date)).all()
    revenue_graph = purchases.with_entities(DatasetsData.purchase_date,
                                            func.sum(DatasetsData.price).label(
                                                'revenue')).group_by(
        DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date)).all()

    response_purchases = {
        'purchases_table': to_dict(purchases_table),
        'purchases_graph': to_dict(purchases_graph),
    }

    return jsonify({'purchases': response_purchases,
                    'revenue': to_dict(revenue_graph)})


'''
###############    USERS    ###############
'''


@app.route('/api/users/<string:dataset_name>/<int:user_id>/info', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_data_users(dataset_name, user_id):
    """
    Get all the data for the user in a single GET request. Get date of first and last
    purchase made by user, purchases made by user, amount of money spent per day
    by user and amount of items bought per day by user.

    :param dataset_name: The name of the dataset to query
    :param user_id: The id of the user you want to get information about
    :return: JSON object:
    {
        "interval": [
            {
                "end_date": "Sun, 01 May 2022 00:00:00 GMT",
                "start_date": "Sat, 02 May 2020 00:00:00 GMT"
            }
        ],
        "bought_per_day": [
            {
                "bought": 1,
                "purchase_date": "Sun, 01 May 2022 00:00:00 GMT"
            }
        ],
        "purchases": [
            {
                "item_id": 0,
                "price": 0.0,
                "purchase_date": "Sun, 01 May 2022 00:00:00 GMT"
            }
        ],
        "spent_per_day": [
            {
                "purchase_date": "Sun, 01 May 2022 00:00:00 GMT",
                "spent": 0.0
            }
        ]
    }
    """
    # Get date of first and last purchase made by user
    interval = DatasetsData.query.with_entities(func.min(DatasetsData.purchase_date).label('start_date'),
                                                func.max(DatasetsData.purchase_date).label('end_date')).filter(
        and_(DatasetsData.user_id == user_id, DatasetsData.dataset_name == dataset_name)
    ).all()
    # Get all purchases made by user
    purchases = get_purchases_users(dataset_name, user_id).json['purchases']
    # Get amount of money spent per day by user
    spent_per_day = get_spent_per_day_users(dataset_name, user_id).json['spent_per_day']
    # Get amount of items bought per day by user
    bought_per_day = get_bought_per_day_users(dataset_name, user_id).json['bought_per_day']

    return jsonify({
        'interval': to_dict(interval),
        'purchases': purchases,
        'spent_per_day': spent_per_day,
        'bought_per_day': bought_per_day
    })


@app.route('/api/users/<string:dataset_name>/<int:user_id>/purchases', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_purchases_users(dataset_name, user_id):
    """
    Get all the purchases made by a user

    :param dataset_name: The name of the dataset to query
    :param user_id: The id of the user you want to get information about
    :return: JSON object:
    {
        "purchases": [
            {
                "item_id": 0,
                "price": 0.0,
                "purchase_date": "Sun, 01 May 2022 00:00:00 GMT"
            }
        ]
    }
    """
    purchases = DatasetsData.query.with_entities(DatasetsData.purchase_date, DatasetsData.price,
                                                 DatasetsData.item_id).filter(
        and_(DatasetsData.dataset_name == dataset_name, DatasetsData.user_id == user_id)
    ).order_by(asc(DatasetsData.purchase_date)).all()
    return jsonify({'purchases': to_dict(purchases)})


@app.route('/api/users/<string:dataset_name>/<int:user_id>/spent', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_spent_per_day_users(dataset_name, user_id):
    """
    Get total amount of money spent by user per day

    :param dataset_name: The name of the dataset to query
    :param user_id: The id of the user you want to get information about
    :return: JSON object:
    {
        "spent_per_day": [
            {
                "purchase_date": "Sun, 01 May 2022 00:00:00 GMT",
                "spent": 0.0
            }
        ]
    }
    """
    spent_per_day = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                     func.sum(DatasetsData.price).label('spent')).filter(
        and_(DatasetsData.dataset_name == dataset_name, DatasetsData.user_id == user_id)
    ).group_by(DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date))
    return jsonify({'spent_per_day': to_dict(spent_per_day)})


@app.route('/api/users/<string:dataset_name>/<int:user_id>/bought', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_bought_per_day_users(dataset_name, user_id):
    """
    Get total amount of items bought by user per day

    :param dataset_name: The name of the dataset to query
    :param user_id: The id of the user you want to get information about
    :return: JSON object:
    {
        "bought_per_day": [
            {
                "bought": 1,
                "purchase_date": "Sun, 01 May 2022 00:00:00 GMT"
            }
        ]
    }
    """
    bought_per_day = DatasetsData.query.with_entities(DatasetsData.purchase_date,
                                                      func.count(DatasetsData.item_id).label('bought')).filter(
        and_(DatasetsData.dataset_name == dataset_name, DatasetsData.user_id == user_id)
    ).group_by(DatasetsData.purchase_date).order_by(asc(DatasetsData.purchase_date))
    return jsonify({'bought_per_day': to_dict(bought_per_day)})


@app.route('/api/users/<string:dataset_name>/<int:user_id>/recommendations', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_recommendations_users(dataset_name, user_id):
    """
    Get top-k recommendations for a user per algorithm and test inside a given interval

    :param dataset_name: The name of the dataset to query
    :param user_id: The id of the user you want to get information about
    :return: JSON object:
    {
        "recommendations": [
            {
                "day": "Sun, 01 May 2022 00:00:00 GMT",
                "item_id": 0,
                "rank": 1
            }
        ]
    }
    """
    # Start date of interval
    start_date = request.args.get('start_date')
    # End date of interval
    end_date = request.args.get('end_date')
    # Value of parameter k
    K = request.args.get('k')
    # ID of test to select recommendations from
    test_id = request.args.get('test_id')
    # Algorithm to select recommendations from
    algorithm = request.args.get('algorithm')

    sql = text(f"""
SELECT item_id, rank, day FROM (
	SELECT Topk.item_id, Topk.rank, Topk.day, COUNT(*) as cnt,
	ROW_NUMBER() OVER (PARTITION BY day order by count(*) desc) as seqnum from Topk
	WHERE Topk.test_id = {test_id} and Topk.algorithm = {algorithm} AND user_id = {user_id}
	group by Topk.day, Topk.rank, Topk.item_id
	) t
where Day <= '{end_date}' AND day >= '{start_date}' AND
seqnum <= {K}
ORDER BY day asc, rank asc
        """)
    recommendations = db.engine.execute(sql)
    return jsonify({'recommendations': to_dict(recommendations)})


@app.route('/api/users/<string:dataset_name>/<int:user_id>/ctr', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_ctr_user_page(dataset_name, user_id):
    """
    Get the CTR for a user inside a given interval for a specific test

    The CTR for a user for a specific timestamp is always 0 or 1.

    :param dataset_name: The name of the dataset to query
    :param user_id: The id of the user you want to get information about
    :return: JSON object:
    {
        "ctr": [
            {
                "ctr": 0.3333333333333333
            }
        ]
    }
    """
    # Start date of interval
    start_date = request.args.get('start_date')
    # End date of interval
    end_date = request.args.get('end_date')
    # ID of test to select recommendations from
    test_id = request.args.get('test_id')

    ctr_sql = text(
        f'SELECT SUM(success) / (COUNT(DISTINCT day)::FLOAT + COUNT(algorithm)::FLOAT) as ctr\n' +
        f'FROM (\n' +
        f'SELECT T.user_id,\n' +
        f'                   T.test_id,\n' +
        f'                   T.day,\n' +
        f'                   T.algorithm,\n' +
        f'                   CASE WHEN EXISTS\n' +
        f'  (SELECT *\n' +
        f'   FROM datasets_data D\n' +
        f'   WHERE D.user_id = {user_id}\n' +
        f'     AND D.item_id = T.item_id AND D.purchase_date <= \'{end_date}\' AND D.purchase_date >= \'{start_date}\' )\n' +
        f'     THEN 1 ELSE 0 END success\n' +
        f'     FROM Topk as T, tests\n' +
        f'     WHERE T.test_id = tests.id and T.user_id = {user_id} AND\n' +
        f'     T.day <= \'{end_date}\' AND T.day >= \'{start_date}\'\n' +
        f'   ORDER BY T.day,\n' +
        f'            success DESC) AS USER_CTR;')

    ctr = db.engine.execute(ctr_sql)

    return jsonify({'ctr': to_dict(ctr)[0]})


"""#  de naam van de FK kolom moet matchen me de naam in de andere table
data = parser.parse_args().data
Base = automap_base()
Base.prepare(db.engine, reflect=True)

if "entries" not in data:
    return {"code": 404, "msg": "entries not found in data!"}, 404
elif "columns" not in data:
    return {"code": 404, "msg": "columns not found in data!"}, 404

db.Column()
columns = dict(
    map(lambda args: (args[0], partial(db.Column, **type_strs2sql(args[1]))),
        [tuple(d.values()) for d in data["columns"]]))

dataset_table = Base.classes[dataset_name]

# add some args
pk_key = None
for key, value in columns.items():
    if 'foreign_key' in value.keywords:
        #  create the one-to-one relationship
        pk_key = key
    else:
        columns[key] = value()

if pk_key is not None:
    columns[pk_key].keywords.pop('foreign_key')
    columns[pk_key] = columns[pk_key](db.ForeignKey(dataset_table.__mapper__.get_property(pk_key)))
    columns[f"{dataset_name}"] = db.relationship(dataset_table,
                                                 backref=backref(meta_dataset_name, uselist=False))

table = type(meta_dataset_name, (db.Model,), columns)
with app.app_context():
    db.create_all()

for entry in data["entries"]:
    instance = table(**entry)
    db.session.add(instance)

db.session.commit()
sql_api.add_model(table)
"""


class Test(Resource):
    def post(self):
        try:
            data = parser.parse_args().data
            start = datetime.datetime.strptime(data["start"], "%Y-%m-%d").date()
            end = datetime.datetime.strptime(data["end"], "%Y-%m-%d").date()
            test_inst = models.Tests(dataset_name=data["datasetname"],
                                     begin=start,
                                     end=end,
                                     step_size=data["stepsize"],
                                     top_k=data["topk"])
            algorithms = []

            for algorithm in data["algorithms"]:
                inst = Algorithms.query.filter(Algorithms.name == algorithm["name"],
                                               Algorithms.parameters == json.dumps(algorithm["parameters"])).first()
                if inst is None:
                    inst = Algorithms(name=algorithm["name"], parameters=json.dumps(algorithm["parameters"]))
                test_inst.algorithms.append(inst)
                algorithms.append(inst)

            db.session.add(test_inst)
            db.session.commit()

            algorithms = [alg.to_dict() for alg in algorithms]

            run_test.delay(pickle.dumps(test_inst.id),
                           pickle.dumps(algorithms),
                           pickle.dumps(data["datasetname"]),
                           pickle.dumps(start),
                           pickle.dumps(end),
                           pickle.dumps(datetime.timedelta(data["stepsize"])),
                           pickle.dumps(data["topk"]))
            return {"code": 200, "msg": "OK"}, 200
        except KeyError as e:
            return {"code": 400, "msg": e}, 400


api.add_resource(Test, '/api/test')

'''
###############    LOGIN    ###############
'''


@app.route('/api/get_token', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def check_token():
    """
    data = request.get_json()
    print(data)
    try:
        flask_jwt_extended.verify_jwt_in_request(optional=DISABLE_AUTH)
        return {"code": 200, "msg": "ok"}, 200
    except:
        return {"code": 401, "msg": "UNAUTHORIZED"}, 401
        """

    return {"code": 200, "msg": "ok"}, 200


@app.route('/api/token', methods=['POST'])
def post_login_token():
    data = request.get_json()
    email: str = data["email"]
    password: str = data["password"]
    byte_psw = password.encode('utf-8')

    db_hash_psw = models.Users.query.with_entities(models.Users.password).where(models.Users.email == email).scalar()

    if db_hash_psw is None:
        return jsonify(("asg", "Bad username or password")), 401
    if not bcrypt.checkpw(byte_psw, db_hash_psw):
        return jsonify(("asg", "Bad username or password")), 401

    is_admin = models.Users.query.with_entities(models.Users.admin).where(models.Users.email == email).scalar()
    additional_claims = {"is_administrator": is_admin}

    access_token = create_access_token(identity=email,
                                       additional_claims=additional_claims)

    return jsonify(access_token=access_token)


@app.route('/api/register_user', methods=['POST'])
def post_new_register():
    data = request.get_json()
    n_username = data["username"]
    n_password = data["password"]
    n_first_name = data["first_name"]
    n_last_name = data["last_name"]
    n_email = data["email"]
    n_admin = data["admin"]  # Should be false always at the register point?

    # Hashing password
    byte_psw = n_password.encode('utf-8')
    psw_salt = bcrypt.gensalt()
    hash_psw = bcrypt.hashpw(byte_psw, salt=psw_salt)
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255))
    password = db.Column(db.String(255))
    first_name = db.Column(db.String(255))
    last_name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    admin = db.Column(db.Boolean)
    """
    if len(models.Users.query.with_entities(models.Users.password).where(models.Users.email == n_email).all()) > 0:
        return jsonify(("asg", "Forbidden")), 403

    entry = models.Users(username=n_username,
                         password=hash_psw,
                         first_name=n_first_name,
                         last_name=n_last_name,
                         email=n_email,
                         admin=n_admin)
    db.session.add(entry)
    db.session.commit()

    return {"code": 200, "msg": "ok"}, 200


@app.route('/api/current_user', methods=['GET'])
@jwt_required(optional=DISABLE_AUTH)
def get_current_user():
    user = Users.query.filter_by(email=get_jwt_identity()).first()
    return jsonify({'name': user.username, 'admin': user.admin} if user else {})
