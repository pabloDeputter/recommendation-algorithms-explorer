import json
import pickle
from datetime import timedelta, datetime

import polars
from celery.utils.log import get_task_logger
from polars import Series
from sqlalchemy import text, between, func

from . import celery, models, db, r
from .Algorithms import ItemKNN
from .models import DatasetsData, Datasets
from .utils import daterange, to_dict

logger = get_task_logger(__name__)


@celery.task()
def run_test(test_id: bytes, algorithms: bytes, dataset_name: bytes, begin: bytes, end: bytes, step_size: bytes,
             topk: bytes) -> None:
    """
    runs an AB test
    :param test_id: int in pickle format
    :param algorithms: list[str] in pickle format
    :param dataset_name: str in pickle format
    :param begin: date in pickle format
    :param end: date in pickle format
    :param step_size: int in pickle format
    :param tokp: int in pickle format
    :return: None
    """
    test_id = pickle.loads(test_id)
    algorithms: list = pickle.loads(algorithms)
    dataset_name = pickle.loads(dataset_name)
    begin = pickle.loads(begin)
    end = pickle.loads(end)
    step_size = pickle.loads(step_size)
    k = pickle.loads(topk)

    start_times: dict = {}
    ran_time: dict = {}

    # Base dict for ETA and duration
    base_eta: dict = {
        "done": False,
        "pushing_to_db": False,
        "taking_longer": False,
        "start_time_test": [int(x) for x in datetime.now().strftime("%H:%M:%S").split(':')],
        "estimated_time": -1,
        "start_db_time": -1
    }

    # General A/B test parameters
    base_parameters = {
        "start_date": begin,
        "end_date": end,
        "dataset_name": dataset_name,
        "step_size": step_size.days,
        "k": k,
        "test_id": test_id
    }

    with db.engine.begin() as conn:
        for key in algorithms:
            r.set(name="average_alg_time_" + str(test_id), value=str(base_eta))
            if len(ran_time.keys()) > 0:
                # Calculating average per test
                sum_ran_times = 0
                for item in ran_time.keys():
                    if sum_ran_times == 0:
                        sum_ran_times = ran_time[item]
                    else:
                        sum_ran_times += ran_time[item]
                avg_ran_time = sum_ran_times / len(ran_time.keys())
                # estimated_time = ran_time[algorithms[algorithms.index(key)-1]["id"]] * (len(algorithms) - algorithms.index(key))
                estimated_time = avg_ran_time * (len(algorithms) - algorithms.index(key))
                base_eta["estimated_time"] = str(
                    [estimated_time.seconds // 3600, estimated_time.seconds // 60 % 60, estimated_time.seconds % 60])
                print(base_eta)
                r.set(name="average_alg_time_" + str(test_id), value=str(base_eta))
                if start_times[algorithms[algorithms.index(key) - 1]["id"]] + estimated_time < datetime.now():
                    base_eta["taking_longer"] = True
                else:
                    base_eta["taking_longer"] = False
            name = key["name"]
            start_times[key["id"]] = datetime.now()
            if name == "popularity":
                # Merge base_parameters and popularity-specific parameters
                popularity_parameters = base_parameters | json.loads(key["parameters"])
                popularity_parameters['algorithm_id'] = key["id"]
                # Create a SQL query based on the parameters in the dictionary and execute it
                conn.execute(create_popularity_query(popularity_parameters))
                ran_time[key["id"]] = datetime.now() - start_times[key["id"]]
                continue
            elif name == "recency":
                # Merge base_parameters and recency-specific parameters
                recency_parameters = base_parameters | json.loads(key["parameters"])
                recency_parameters['algorithm_id'] = key["id"]
                # Create a SQL query based on the parameters in the dictionary and execute it
                conn.execute(create_recency_query(recency_parameters))
                ran_time[key["id"]] = datetime.now() - start_times[key["id"]]
                continue

            key["parameters"] = json.loads(key["parameters"])
            retrain_interval = key["parameters"].pop("retrain_interval")
            window_size = key["parameters"].pop("window_size")
            alg = ItemKNN.ItemKNN(**key["parameters"])
            # counter: int = 0
            for current in daterange(begin, end + timedelta(1)):
                if not ((current - begin).days % retrain_interval):  # if after retrain_interval days, fit the model
                    print("training")
                    interactions = DatasetsData.query.with_entities(DatasetsData.user_id, DatasetsData.item_id).filter(
                        between(DatasetsData.purchase_date, begin, current),
                        DatasetsData.dataset_name == dataset_name).group_by(DatasetsData.user_id,
                                                                            DatasetsData.item_id).order_by(
                        DatasetsData.user_id).all()
                    unique_item_ids = DatasetsData.query.with_entities(func.distinct(DatasetsData.item_id)).filter(
                        between(DatasetsData.purchase_date, begin, current),
                        DatasetsData.dataset_name == dataset_name).all()
                    alg.train(interactions, [id_[0] for id_ in unique_item_ids])
                    del interactions
                if not ((current - begin).days % step_size.days):  # every stepsize days, run simulation
                    print("recommending")
                    item_ids = DatasetsData.query.with_entities(func.array_agg(DatasetsData.item_id)).filter(
                        between(DatasetsData.purchase_date, begin, current),
                        DatasetsData.dataset_name == dataset_name).group_by(DatasetsData.user_id).all()
                    user_ids = DatasetsData.query.with_entities(func.distinct(DatasetsData.user_id)).filter(
                        between(DatasetsData.purchase_date, begin, current),
                        DatasetsData.dataset_name == dataset_name).order_by(DatasetsData.user_id).all()
                    item_ids = [item_id._data[0] for item_id in item_ids]
                    user_ids = [user_id._data[0] for user_id in user_ids]
                    result = alg.recommend_all(item_ids, k)
                    for user_id, topk_list in zip(user_ids, result):
                        for rank, item_id in enumerate(topk_list):
                            entry = models.Topk(test_id=test_id, algorithm=key["id"], item_id=int(item_id),
                                                user_id=user_id,
                                                day=current, rank=rank + 1)
                            db.session.add(entry)
            ran_time[key["id"]] = datetime.now() - start_times[key["id"]]

    print("testing done, doing pre-computations")
    base_eta["pushing_to_db"] = True
    timetuple = datetime.now().timetuple()
    base_eta["start_db_time"] = str([timetuple[3], timetuple[4], timetuple[5]])
    r.set(name="average_alg_time_" + str(test_id), value=str(base_eta))
    print("starting 1")
    db.session.execute(text(f"""insert into "CTR" (transaction_id, test_id, algorithm, user_id)
        select id::BIGINT, test_id, algorithm, topk.user_id
    from datasets_data
             join topk on day = purchase_date and topk.item_id = datasets_data.item_id and
                          topk.user_id = datasets_data.user_id and dataset_name = '{dataset_name}' and topk.test_id = {test_id};"""))
    print("starting 2")
    db.session.execute(text(f"""insert into "CTR_7" (transaction_id, test_id, algorithm, item_id)
         select distinct id::BIGINT, test_id, algorithm, topk.item_id
    from datasets_data
             join topk on day between purchase_date - 7 and purchase_date and topk.item_id = datasets_data.item_id and
                          topk.user_id = datasets_data.user_id and dataset_name = '{dataset_name}' and topk.test_id = {test_id};
                          """))
    print("starting 3")
    db.session.execute(text(f"""insert into "CTR_30" (transaction_id, test_id, algorithm, item_id)
           select distinct id::BIGINT, test_id, algorithm, topk.item_id
    from datasets_data
             join topk on day between purchase_date - 7 and purchase_date and topk.item_id = datasets_data.item_id and
                          topk.user_id = datasets_data.user_id and dataset_name = '{dataset_name}' and topk.test_id = {test_id};
                          """))
    db.session.commit()

    base_eta["done"] = True
    r.set(name="average_alg_time_" + str(test_id), value=str(base_eta))


@celery.task()
def upload_datasets(file_paths, dataset_name, dataset_columns, user_pk, item_pk, item_name):
    # Unpickle parameters
    db.engine.dispose(False)
    file_paths = pickle.loads(file_paths)
    dataset_name = pickle.loads(dataset_name)
    print("Start uploading " + dataset_name + " in the background")
    try:
        # Load dataset in dataframe
        df = polars.read_csv(file_paths['data'], low_memory=True)
        # Use column mapping to set the purchase_date, user_id, item_id and price column
        mappings = json.loads(pickle.loads(dataset_columns))
        for key in ['purchase_date', 'user_id', 'item_id', 'price']:
            df.rename({mappings[key]: key})
        df = df.with_column(polars.lit(dataset_name).alias('dataset_name'))
        df.write_csv(file_paths['data'], sep=";")
        del df

        with db.engine.begin() as conn:

            print("Start copying dataset " + dataset_name + " to table")

            conn.execute(text(f"""
                ALTER TABLE datasets_data
                DROP CONSTRAINT IF EXISTS datasets_data_dataset_name_fkey;
            
                COPY datasets_data(purchase_date, user_id, item_id, price, dataset_name)
                FROM '{file_paths['data']}'
                DELIMITER ';'
                CSV HEADER;
                
                ALTER TABLE datasets_data ADD CONSTRAINT datasets_data_dataset_name_fkey
                FOREIGN KEY (dataset_name) REFERENCES datasets (name) ON DELETE CASCADE ;
            """))

            print("Done copying dataset " + dataset_name + " to table")

            # Prepare user metadata to be uploaded in the table
            if "user_data" in file_paths:
                primary_key = pickle.loads(user_pk)
                user_df = polars.read_csv(file_paths['user_data'], low_memory=True)
                user_df.with_column(
                    Series(user_df.rename({primary_key: 'user_id'}).to_struct("user_metadata").to_numpy().astype(str,
                                                                                                                 casting='unsafe')).alias(
                        'user_metadata')) \
                    .rename({primary_key: 'id'}) \
                    .with_column(polars.lit(dataset_name).alias('dataset_name')) \
                    .select(['id', 'dataset_name', 'user_metadata']) \
                    .to_pandas().to_csv(file_paths['user_data'], sep=";", index=False)
                del user_df
                print("Start copying userdata " + dataset_name + " to table")
                conn.execute(text(f"""
                    COPY user_metadata(id, dataset_name, user_metadata)
                    FROM '{file_paths['user_data']}'
                    DELIMITER ';'
                    CSV HEADER;
                """))
                print("Done copying userdata " + dataset_name + " to table")

            # Prepare item metadata to be uploaded in the table
            if "item_data" in file_paths:
                item_name = pickle.loads(item_name)
                primary_key = pickle.loads(item_pk)
                item_df = polars.read_csv(file_paths['item_data'], low_memory=True)
                item_df.with_column(
                    Series(item_df.rename({primary_key: 'item_id', item_name: 'name'}).to_struct(
                        "item_metadata").to_numpy().astype(str,
                                                           casting='unsafe')).alias(
                        'item_metadata')) \
                    .rename({primary_key: 'id'}) \
                    .with_column(polars.lit(dataset_name).alias('dataset_name')) \
                    .select(['id', 'dataset_name', 'item_metadata']) \
                    .to_pandas().to_csv(file_paths['item_data'], sep=";", index=False)
                del item_df
                print("Start copying itemdata " + dataset_name + " to table")
                conn.execute(text(f"""
                    COPY item_metadata(id, dataset_name, item_metadata)
                    FROM '{file_paths['item_data']}'
                    DELIMITER ';'
                    CSV HEADER;
                """))
                print("Done copying itemdata " + dataset_name + " to table")

        with db.engine.begin() as conn:
            counts = to_dict(conn.execute(text(f"""
                SELECT COUNT(DISTINCT user_id) AS users, COUNT(DISTINCT item_id) as items
                FROM datasets_data WHERE dataset_name='{dataset_name}'
            """)))[0]
            conn.execute(text(f"""
                UPDATE datasets SET user_count={counts['users']}, item_count={counts['items']} WHERE name='{dataset_name}'
            """))
            print("Preprocessing user and itemcount of " + dataset_name + " done")

            # Remove the uploading state to display the dataset in the overview page
            r.delete(dataset_name + "_uploading")
            print("Succesfully uploaded " + dataset_name + "!")

        with db.engine.begin() as conn:
            # Calculate how much time each item is interacted with per day
            conn.execute(text(f"""
                ALTER TABLE items_day_count
                DROP CONSTRAINT IF EXISTS items_day_count_dataset_name_fkey;
            
                INSERT INTO items_day_count (dataset_name, purchase_date, item_id, item_count)
                SELECT dataset_name, purchase_date, item_id, COUNT(item_id) AS item_count
                FROM datasets_data
                WHERE dataset_name='{dataset_name}'
                GROUP BY dataset_name, purchase_date, item_id;
                
                ALTER TABLE items_day_count ADD CONSTRAINT items_day_count_dataset_name_fkey
                FOREIGN KEY (dataset_name) REFERENCES datasets (name) ON DELETE CASCADE ;
            """))

            print("Preprocessing item daycount of " + dataset_name + " done")

            # Calculate the recency of every item for every day
            conn.execute(text(f"""
                ALTER TABLE recency
                DROP CONSTRAINT IF EXISTS recency_dataset_name_fkey;
                
                INSERT INTO recency (dataset_name, purchase_date, item_id, first_interaction, rank)
                SELECT dataset_name, purchase_date, item_id, first_interaction,
                       row_number() over (PARTITION BY purchase_date ORDER BY first_interaction DESC) AS rank
                FROM (SELECT dataset_name, purchase_date, item_id, first_interaction
                      FROM (SELECT DISTINCT purchase_date
                            FROM items_day_count
                            WHERE dataset_name = '{dataset_name}') AS dates,
                           (SELECT dataset_name, item_id, min(purchase_date) AS first_interaction
                            FROM items_day_count
                            WHERE dataset_name = '{dataset_name}'
                            GROUP BY item_id, dataset_name) AS first_interactions
                      GROUP BY dataset_name, purchase_date, first_interaction, item_id
                      HAVING first_interaction <= dates.purchase_date
                      ORDER BY purchase_date, first_interaction DESC) AS recency_unranked;
                      
                ALTER TABLE recency ADD CONSTRAINT recency_dataset_name_fkey
                FOREIGN KEY (dataset_name) REFERENCES datasets (name) ON DELETE CASCADE ;
            """))
            print("Preprocessing recency of " + dataset_name + " done")

    except Exception as e:
        print("Error while uploading " + dataset_name)
        print(e)
        delete_dataset = Datasets.query.filter(Datasets.name == dataset_name).delete()
        db.engine.execute(delete_dataset)


def create_recency_query(parameters):
    """
    Creates a query based on the parameters to insert recency algorithm simulation data into the topk table
    :param parameters: dictionary with algorithm parameters
    :return: query as a text object
    """

    # Unpack algorithm parameters
    start_date = parameters["start_date"]
    end_date = parameters["end_date"]
    retrain_interval = parameters["retrain_interval"]
    dataset_name = parameters["dataset_name"]
    k = parameters["k"]
    step_size = parameters["step_size"]
    test_id = parameters["test_id"]
    algorithm_id = parameters["algorithm_id"]

    return text(f"""
    -- Calculate for every day, the last day that the model was retrained (retrain_interval=3)
    CREATE TEMPORARY VIEW retrain_interval AS (
        SELECT DISTINCT purchase_date,
        ('{start_date}'::DATE + ((purchase_date - '{start_date}'::DATE)/{retrain_interval} * {retrain_interval})) AS relative
        FROM items_day_count
        WHERE dataset_name='{dataset_name}' AND purchase_date BETWEEN '{start_date}'::DATE AND '{end_date}'::DATE
    );

    -- Only keep the top K items (k=10)
    CREATE TEMPORARY VIEW recency_ranked_limited AS (
        SELECT * FROM recency WHERE rank <= {k}
    );

    -- Calculate for every day, the last day that the model was retrained (retrain_interval=3)
    CREATE TEMPORARY VIEW active_users AS (
        SELECT user_id,
               ('{start_date}'::DATE + ((purchase_date - '{start_date}'::DATE)/{step_size} * {step_size})) AS step
        FROM datasets_data
        WHERE dataset_name='{dataset_name}' AND purchase_date BETWEEN '{start_date}'::DATE AND '{end_date}'::DATE
        GROUP BY step, user_id
        ORDER BY step, user_id
    );

    -- Combine the active users and the last retrain days
    CREATE TEMPORARY VIEW active_users_relative_dates AS (
        SELECT users.step, users.user_id, retrain.relative
        FROM (active_users users INNER JOIN retrain_interval retrain ON users.step = retrain.purchase_date)
    );

    -- Bring everything together by joining the retrain days with new popularity top
    CREATE TEMPORARY VIEW result AS (
        SELECT users.user_id, users.step, recency.item_id, recency.rank
        FROM active_users_relative_dates users
                 INNER JOIN recency_ranked_limited recency ON users.relative = recency.purchase_date
        WHERE dataset_name='{dataset_name}'
    );
    
    ALTER TABLE topk
    DROP CONSTRAINT IF EXISTS topk_test_id_algorithm_fkey;

    INSERT INTO topk (test_id, algorithm, item_id, user_id, day, rank)
    SELECT {test_id}, {algorithm_id}, item_id, user_id, step, rank FROM result;
    
    ALTER TABLE topk ADD CONSTRAINT topk_test_id_algorithm_fkey
    FOREIGN KEY (test_id, algorithm) REFERENCES has_algorithm(test_id, algorithm_id) ON DELETE CASCADE;

    DROP VIEW retrain_interval CASCADE ;
    DROP VIEW recency_ranked_limited CASCADE ;
    DROP VIEW active_users CASCADE ;
    """)


def create_popularity_query(parameters):
    """
    Creates a query based on the parameters to insert popularity algorithm simulation data into the topk table
    :param parameters: dictionary with algorithm parameters
    :return: query as a text object
    """

    # Unpack algorithm parameters
    start_date = parameters["start_date"]
    end_date = parameters["end_date"]
    retrain_interval = parameters["retrain_interval"]
    dataset_name = parameters["dataset_name"]
    window_size = parameters["window_size"]
    k = parameters["k"]
    step_size = parameters["step_size"]
    test_id = parameters["test_id"]
    algorithm_id = parameters["algorithm_id"]

    return text(f"""
    -- Calculate for every day, the last day that the model was retrained (retrain_interval=3)
    CREATE TEMPORARY VIEW retrain_interval AS (
        SELECT DISTINCT purchase_date,
                   ('{start_date}'::DATE + ((purchase_date - '{start_date}'::DATE)/{retrain_interval} * {retrain_interval})) AS relative
        FROM items_day_count
        WHERE dataset_name='{dataset_name}' AND purchase_date BETWEEN '{start_date}'::DATE AND '{end_date}'::DATE
    );

    -- Calculate the popularity for each item based on window size for each day (window_size=5, retrain_interval=3)
    CREATE TEMPORARY VIEW popularity AS (
        SELECT purchase_date,
               item_id,
               sum(item_count) OVER (PARTITION BY item_id ORDER BY purchase_date
                   ROWS BETWEEN {window_size} PRECEDING AND CURRENT ROW)
                   as total_interactions
        FROM items_day_count
        WHERE dataset_name='{dataset_name}' AND purchase_date BETWEEN '{start_date}'::DATE AND '{end_date}'::DATE
        GROUP BY purchase_date, item_id, item_count
        HAVING MOD((purchase_date - '{start_date}'::DATE), {retrain_interval}) = 0
        ORDER BY purchase_date ASC, total_interactions DESC
    );

    -- Rank the popularities, used to eventually keep the top K items
    CREATE TEMPORARY VIEW popularity_ranked AS (
        SELECT *,
           row_number() over (PARTITION BY purchase_date ORDER BY total_interactions DESC) AS rank
        FROM popularity
    );

    -- Only keep the top K items (k=10)
    CREATE TEMPORARY VIEW popularity_ranked_limited AS (
        SELECT * FROM popularity_ranked WHERE rank <= {k}
    );

    -- Calculate for every day, the last day that the model was retrained (retrain_interval=3)
    CREATE TEMPORARY VIEW active_users AS (
        SELECT user_id,
               ('{start_date}'::DATE + ((purchase_date - '{start_date}'::DATE)/{step_size} * {step_size})) AS step
        FROM datasets_data
        WHERE dataset_name='{dataset_name}' AND purchase_date BETWEEN '{start_date}'::DATE AND '{end_date}'::DATE
        GROUP BY step, user_id
        ORDER BY step, user_id
    );

    -- Combine the active users and the last retrain days
    CREATE TEMPORARY VIEW active_users_relative_dates AS (
        SELECT users.step, users.user_id, step.relative
        FROM (active_users users INNER JOIN retrain_interval step ON users.step = step.purchase_date)
    );

    -- Bring everything together by joining the retrain days with new popularity top
    CREATE TEMPORARY VIEW result AS (
        SELECT users.user_id, users.step, popularity.item_id, popularity.rank
        FROM active_users_relative_dates users
             INNER JOIN popularity_ranked_limited popularity ON users.relative = popularity.purchase_date
    );
    
    ALTER TABLE topk
    DROP CONSTRAINT IF EXISTS topk_test_id_algorithm_fkey;

    INSERT INTO topk (test_id, algorithm, item_id, user_id, day, rank)
    SELECT {test_id}, {algorithm_id}, item_id, user_id, step, rank FROM result;
    
    ALTER TABLE topk ADD CONSTRAINT topk_test_id_algorithm_fkey
    FOREIGN KEY (test_id, algorithm) REFERENCES has_algorithm(test_id, algorithm_id) ON DELETE CASCADE;

    DROP VIEW retrain_interval CASCADE;
    DROP VIEW popularity CASCADE;
    DROP VIEW active_users CASCADE;
    """)
