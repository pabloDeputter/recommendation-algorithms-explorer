import ast
import json
import pickle

from sqlalchemy.dialects.postgresql import BYTEA

from . import db, app, sql_api
from .utils import json_patch, admin_required


class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255))
    password = db.Column(BYTEA)
    first_name = db.Column(db.String(255))
    last_name = db.Column(db.String(255))
    email = db.Column(db.String(255), unique=True)
    admin = db.Column(db.Boolean)


class Datasets(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text)
    users_types = db.Column(db.Text)
    items_name = db.Column(db.String(255))
    items_types = db.Column(db.Text)
    item_count = db.Column(db.Integer)
    user_count = db.Column(db.Integer)

    # data = db.relationship("DatasetsData", back_populates="dataset", cascade="all, delete")
    tests = db.relationship("Tests", back_populates="dataset", passive_deletes=True)


class ItemMetadata(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    dataset_name = db.Column(db.String(255), db.ForeignKey(Datasets.name, ondelete="cascade"), primary_key=True)
    item_metadata = db.Column(db.Text)


class UserMetadata(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    dataset_name = db.Column(db.String(255), db.ForeignKey(Datasets.name, ondelete="cascade"), primary_key=True)
    user_metadata = db.Column(db.Text)


class DatasetsData(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    dataset_name = db.Column(db.String(255), db.ForeignKey(Datasets.name, ondelete="cascade"), index=True)
    purchase_date = db.Column(db.Date)
    user_id = db.Column(db.Integer)
    item_id = db.Column(db.Integer)
    price = db.Column(db.Float)

    # dataset = db.relationship(Datasets, back_populates="data")


class Algorithms(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    parameters = db.Column(db.String(255))

    tests = db.relationship("Tests",
                            secondary=lambda: has_algorithm,
                            back_populates="algorithms",
                            cascade="all, delete")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "parameters": self.parameters}


class Tests(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dataset_name = db.Column(db.String(255), db.ForeignKey(Datasets.name, ondelete="cascade"), index=True,
                             nullable=False)
    begin = db.Column(db.Date)
    end = db.Column(db.Date)
    step_size = db.Column(db.Integer)
    top_k = db.Column(db.Integer)

    algorithms = db.relationship(Algorithms,
                                 secondary=lambda: has_algorithm,
                                 back_populates="tests",
                                 cascade="all, delete")

    dataset = db.relationship(Datasets, back_populates="tests")


has_algorithm = db.Table('has_algorithm', db.metadata,
                         db.Column('test_id', db.ForeignKey(Tests.id, ondelete="cascade"), primary_key=True),
                         db.Column('algorithm_id', db.ForeignKey(Algorithms.id), primary_key=True)
                         )


class Topk(db.Model):
    test_id = db.Column(db.Integer, primary_key=True)
    algorithm = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer)
    user_id = db.Column(db.Integer, primary_key=True)
    day = db.Column(db.Date, primary_key=True)
    rank = db.Column(db.Integer, primary_key=True)
    db.ForeignKeyConstraint([test_id, algorithm], [has_algorithm.c.test_id, has_algorithm.c.algorithm_id],
                            ondelete="cascade")


class CTR(db.Model):
    transaction_id = db.Column(db.BigInteger, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey(Tests.id, ondelete="cascade"), primary_key=True)
    algorithm = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)


class CTR_7(db.Model):
    transaction_id = db.Column(db.BigInteger, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey(Tests.id, ondelete="cascade"), primary_key=True)
    algorithm = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer)


class CTR_30(db.Model):
    transaction_id = db.Column(db.BigInteger, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey(Tests.id, ondelete="cascade"), primary_key=True)
    algorithm = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer)


class ItemsDayCount(db.Model):
    id = db.Column(db.BigInteger, primary_key=True)
    item_id = db.Column(db.Integer)
    dataset_name = db.Column(db.String(255), db.ForeignKey(Datasets.name, ondelete="cascade"), index=True)
    purchase_date = db.Column(db.Date)
    item_count = db.Column(db.Integer)


class Recency(db.Model):
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dataset_name = db.Column(db.String(255), db.ForeignKey(Datasets.name, ondelete="cascade"), index=True)
    purchase_date = db.Column(db.Date)
    item_id = db.Column(db.Integer)
    first_interaction = db.Column(db.Date)
    rank = db.Column(db.Integer)


with app.app_context():
    db.create_all()

db.session.commit()
with app.app_context():
    db.create_all()


# dirty hack, but is works. https://github.com/jeff-hykin/json_fix
def test_get_decorator(func):
    def wrapper(id=None):
        with json_patch(bytes, lambda obj_of_that_class: pickle.loads(obj_of_that_class)):
            res = func(id)
        return res

    return wrapper


def item_metadata_get_decorator(func):
    def wrapper(id=None):
        res = func(id)
        data = json.loads(res[0].data)
        for item in data["data"]["list"]:
            item["item_metadata"] = ast.literal_eval(json.dumps(item['item_metadata'])).replace("'", '"').replace(
                "None", "\"NONE\"")
        res[0].data = json.dumps(data)
        return res

    return wrapper


def user_metadata_get_decorator(func):
    def wrapper(id=None):
        res = func(id)
        data = json.loads(res[0].data)
        for user in data["data"]["list"]:
            user["user_metadata"] = ast.literal_eval(json.dumps(user['user_metadata'])).replace("'", '"').replace(
                "None", "\"NONE\"")
        res[0].data = json.dumps(data)
        return res

    return wrapper


def datasets_delete_decorator(func):
    def wrapper(id=None):  # I have no choice
        admin_required()(func)
        try:
            int(id)
        except ValueError:
            id = Datasets.query.with_entities(Datasets.id).where(Datasets.name == id).scalar()
        return func(str(id))

    return wrapper


# create api paths
sql_api.add_model(Users, get_decorator=admin_required(), delete_decorator=admin_required(),
                  put_decorator=admin_required())
sql_api.add_model(ItemMetadata, methods=["GET"], get_decorator=item_metadata_get_decorator)
sql_api.add_model(UserMetadata, methods=["GET"], get_decorator=user_metadata_get_decorator)
# sql_api.add_model(Algorithms)
sql_api.add_model(Datasets, post_decorator=admin_required(), put_decorator=admin_required(),
                  delete_decorator=datasets_delete_decorator, get_decorator=admin_required())
sql_api.add_model(DatasetsData, methods=["GET"])
sql_api.add_model(Tests, methods=['GET', 'DELETE'], get_decorator=test_get_decorator)
