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

    data_dictionary = None
    if token:
        try:
            data_dictionary = redcap_api.fetch_data_dictionary(token)
        except Exception as e:
            results = {'error': "Error: {0}".format(e)}
            response = flask.jsonify(results)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
    else:
        dataDictionaryName = form.get("dataDictionaryName")
        if dataDictionaryName.endswith(".csv"):
            dd_df = pd.read_csv(request.files['dataDictionary'])
        elif dataDictionaryName.endswith(".xlsx") or dataDictionaryName.endswith(".xls"):
            dd_df = pd.read_excel(request.files['dataDictionary'])

    records = None
    csv_headers = {}
    json_data = {}
    dd_headers = []
    dd_data = {}
    if data_dictionary is not None:
        dd_headers = data_dictionary[0].keys()
        dd_data = data_dictionary
    else:
        dd_headers = list(dd_df.columns)
        dd_data = json.loads(dd_df.to_json(orient='records'))
    for sheetName, sheet in excel.items():
        csv_headers[sheetName] = list(sheet.columns)
        json_data[sheetName] = json.loads(sheet.to_json(orient='records'))


    results = {
        'csvHeaders': csv_headers,
        'jsonData': json_data,
        'ddHeaders': dd_headers,
        'ddData': dd_data
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
