import flask
from flask import request
import logging
import json
import pandas as pd
from flask_cors import CORS, cross_origin
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from utils import utils

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)


@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def post_form():
    excel = pd.read_excel(request.files['dataFile'], sheet_name=None)
    form = request.form.to_dict()
    token = form.get('token')
    env = form.get('environment')

    redcap_api = RedcapApi(env)
    app.logger.info(redcap_api.format)

    records = None
    csvHeaders = {}
    jsonData = {}
    for sheetName, sheet in excel.items():
        csvHeaders[sheetName] = list(sheet.columns)
        jsonData[sheetName] = sheet.to_json(orient='records')


    results = {'csvHeaders': csvHeaders, 'jsonData': jsonData}
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
