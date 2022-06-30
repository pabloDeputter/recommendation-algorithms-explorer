import datetime
import decimal
from contextlib import contextmanager
from functools import wraps
from typing import Optional

import numpy as np
import pandas as pd
import scipy.sparse
import sqlalchemy
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from sqlalchemy import text

from . import DISABLE_AUTH

ITEM_ID = 'iid'
USER_ID = 'uid'

# https://stackoverflow.com/a/57072280/10875953
_type_py2sql_dict = {
    int: sqlalchemy.sql.sqltypes.BigInteger,
    str: sqlalchemy.sql.sqltypes.Unicode,
    float: sqlalchemy.sql.sqltypes.Float,
    decimal.Decimal: sqlalchemy.sql.sqltypes.Numeric,
    datetime.datetime: sqlalchemy.sql.sqltypes.DateTime,
    bytes: sqlalchemy.sql.sqltypes.LargeBinary,
    bool: sqlalchemy.sql.sqltypes.Boolean,
    datetime.date: sqlalchemy.sql.sqltypes.Date,
    datetime.time: sqlalchemy.sql.sqltypes.Time,
    datetime.timedelta: sqlalchemy.sql.sqltypes.Interval,
    list: sqlalchemy.sql.sqltypes.ARRAY,
    dict: sqlalchemy.sql.sqltypes.JSON
}


def type_py2sql(pytype):
    '''Return the closest sql type for a given python type'''
    if type(pytype) is str:
        return (pytype, True)

    if pytype in _type_py2sql_dict:
        return ("type_", _type_py2sql_dict[pytype])
    else:
        raise NotImplementedError(
            "You may add custom `sqltype` to `" + str(pytype) + "` assignment in `_type_py2sql_dict`.")


def type_np2py(dtype=None, arr=None):
    '''Return the closest python type for a given numpy dtype'''

    if ((dtype is None and arr is None) or
            (dtype is not None and arr is not None)):
        raise ValueError(
            "Provide either keyword argument `dtype` or `arr`: a numpy dtype or a numpy array.")

    if dtype is None:
        dtype = arr.dtype

    elif dtype == "date":
        return datetime.date
    elif dtype == "datetime":
        return datetime.datetime

    # 1) Make a single-entry numpy array of the same dtype
    # 2) force the array into a python 'object' dtype
    # 3) the array entry should now be the closest python type
    try:
        single_entry = np.empty([1], dtype=dtype).astype(object)
    except TypeError:
        return dtype

    return type(single_entry[0])


def type_np2sql(dtype=None, arr=None):
    '''Return the closest sql type for a given numpy dtype'''
    return type_py2sql(type_np2py(dtype=dtype, arr=arr))


def type_strs2sql(strs: list[str]):
    return {res[0]: res[1] for s in strs if (res := type_np2sql(s))}


# https://stackoverflow.com/a/1060330/10875953
def daterange(start_date, end_date, step=1):
    """
    :param start_date: datetime.date object
    :param end_date: datetime.date object
    :param step: step_size
    :return: generator
    """
    for n in range(0, int((end_date - start_date).days) + 1, step):
        yield start_date + datetime.timedelta(n)


def to_dict(l):
    return [dict(row._mapping) for row in l]


def df_to_csr(df: pd.DataFrame):
    """ Converts a dataframe with columns ITEM_ID and USER_ID to a sparse csr matrix of interactions. """
    data = np.ones(len(df), dtype=np.int8)
    return scipy.sparse.csr_matrix((data, (df[USER_ID], df[ITEM_ID])), dtype=np.int8)


def path_to_df(path: str, item_col, user_col):
    """ Reads a csv file from path to a pandas dataframe with columns ITEM_ID and USER_ID. """
    df = pd.read_csv(path)
    df.rename(columns={
        item_col: ITEM_ID,
        user_col: USER_ID
    }, inplace=True)
    df = df[[ITEM_ID, USER_ID]]
    return df


def path_to_csr(path: str, item_col, user_col):
    """ Reads a csv file and converts it to a sparse csr matrix of interactions. """
    df = path_to_df(path, item_col, user_col)
    matrix = df_to_csr(df)
    return matrix


def query_to_df(combinations, item_col, user_col):
    """ Reads a csv file from path to a pandas dataframe with columns ITEM_ID and USER_ID. """
    if len(combinations) == 0:
        return None
    relations = {ITEM_ID: [], USER_ID: []}

    for relation in combinations:
        relations[ITEM_ID].append(item_col[relation[0]])
        relations[USER_ID].append(user_col[relation[1]])

    df = relations
    return df


def make_dict(l):
    """ Gets a list of id's and puts them in to a dict """
    return dict(zip([user[0] for user in l], range(len(l))))


def df_to_csr_(df: pd.DataFrame, size):
    """ Converts a dataframe with columns ITEM_ID and USER_ID to a sparse csr matrix of interactions. """
    data = np.ones(len(df[USER_ID]), dtype=np.int8)
    return scipy.sparse.csr_matrix((data, (df[USER_ID], df[ITEM_ID])), dtype=np.int8, shape=size)


def mergeMatrices(matrices):
    # dit kan mss ook nog beter geschreven worden
    returnMatrix = matrices[0]
    for matrix in matrices:
        returnMatrix += matrix
    row, col = returnMatrix.shape

    for i in range(row):
        for r in range(returnMatrix.indptr[i], returnMatrix.indptr[i + 1]):
            if returnMatrix.data[r] != 0:
                returnMatrix.data[r] = 1
    return returnMatrix


def table_to_csr(db, dataset_data, dataset_name, start_date: datetime.date, end_date: Optional[datetime.date] = None):
    res = db.session.execute(text(f"""
    select row - min(row), col - min(col) from ranks where purchase_date between '{start_date}' and '{end_date}';
    """)).all()

    # res = dataset_data.query.with_entities(func.dense_rank().over(order_by=dataset_data.user_id).label("row"),
    #                                        func.dense_rank().over(order_by=dataset_data.item_id).label("col")).where(
    #     between(dataset_data.purchase_date, start_date, end_date)).group_by(dataset_data.user_id,
    #                                                                         dataset_data.item_id).all()
    db.session.commit()
    row, col = np.array(list(zip(*res)))
    data = np.ones(len(res), dtype=np.int8)
    return scipy.sparse.csr_matrix((data, (row, col)), dtype=np.int8)


@contextmanager
def json_patch(patch_obj, to_json_func):
    """
    changes the way this object is jsonified within the context manager
    :param obj: an object
    :param to_json_func: a function wich return a jsonifyable object
    :return: None
    """
    import json
    class_checker = lambda obj: isinstance(obj, patch_obj)
    # then assign it to a function that does the converting
    json.override_table[class_checker] = to_json_func
    yield
    del json.override_table[class_checker]


def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            if DISABLE_AUTH:
                return fn(*args, **kwargs)
            verify_jwt_in_request()
            claims = get_jwt()
            if "is_administrator" in claims and claims["is_administrator"]:
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Admins only!"), 403

        return decorator

    return wrapper
