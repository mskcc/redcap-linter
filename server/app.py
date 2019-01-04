import flask
from flask import request
import logging
import json
import pandas as pd
from flask_cors import CORS, cross_origin

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)


@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def post_form():
    response = flask.jsonify({'some': 'data'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    # json_data = json.loads(request.form.to_dict().keys()[0])
    # app.logger.info(json_data)
    # file = json_data['dataFile']
    excel = pd.read_excel(request.files['dataFile'], sheet_name=None, dtype=str)
    records = None
    return response

CORS(app, expose_headers='Authorization')