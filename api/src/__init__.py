import os
from datetime import timedelta

import json_fix
import redis
from celery import Celery
from dotenv import load_dotenv
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_jwt_extended import jwt_required
from flask_restful import Api, reqparse
from flask_sqlalchemy import SQLAlchemy
from flask_sqlalchemy_rest import Rest as SqlApi

from . import celery_config
from .config import config_data

json_fix.fix_it()  # does nothing, just prevents unused lib
load_dotenv("./.env")

# https://www.the-analytics.club/how-to-serve-massive-computations-using-python-web-apps

app = Flask(__name__, static_folder='../../build', static_url_path='/')
# Setup the Flask-JWT-Extended extension
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)
app.config[
    'SQLALCHEMY_DATABASE_URI'] = f'postgresql+psycopg2://{config_data["dbuser"]}:@localhost:5432/{config_data["dbname"]}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config.update(
    CELERY_BROKER_URL='redis://localhost:6379',
    CELERY_RESULT_BACKEND='redis://localhost:6379'
)
app.config['UPLOAD_FOLDER'] = "/tmp"
celery = Celery()
celery.config_from_object(celery_config)
db = SQLAlchemy(app)
DISABLE_AUTH: bool = False
sql_api = SqlApi(app, db, auth_decorator=jwt_required(optional=DISABLE_AUTH))  # enable/disable auth
api = Api(app)
parser = reqparse.RequestParser()
r = redis.Redis(host="localhost", port=6379, db=0)
