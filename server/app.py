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
    # json_data = json.loads(request.form.to_dict().keys()[0])
    # app.logger.info(json_data)
    # file = json_data['dataFile']
    excel = pd.read_excel(request.files['dataFile'], sheet_name=None)
    app.logger.info(list(excel.get(excel.keys()[0]).columns))
    records = None
    csvHeaders = {}
    for sheetName, sheet in excel.items():
        csvHeaders[sheetName] = list(sheet.columns)
    results = {'csvHeaders': csvHeaders}
    app.logger.info(list(excel.keys()))
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
