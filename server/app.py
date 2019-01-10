import flask
from flask import request
import logging
import json
import pandas as pd
from flask_cors import CORS, cross_origin
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from linter import linter
from utils import utils

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)


@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def post_form():
    records = pd.read_excel(request.files['dataFile'], sheet_name=None)
    for key in records:
        records.get(key).replace('nan', '', inplace=True)
    form = request.form.to_dict()
    token = form.get('token')
    env = form.get('environment')
    ri = form.get('repeatableInstruments')

    project_info = {
        'custom_record_label': '',
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 0,
        'repeatable_instruments': []
    }

    if ri:
        project_info['repeatable_instruments'] = [utils.titleize(instrument) for instrument in ri.split(',')]

    redcap_api = RedcapApi(env)
    app.logger.info(__name__)

    data_dictionary = None
    if token:
        try:
            data_dictionary = redcap_api.fetch_data_dictionary(token)
            dd = [RedcapField.from_json(field) for field in data_dictionary[1:]]
            project_info = redcap_api.fetch_project_info(token)
            if project_info['has_repeating_instruments_or_events'] == 1:
                repeatable_instruments = redcap_api.fetch_repeatable_instruments(token)
                project_info['repeatable_instruments'] = [utils.titleize(i['form_name']) for i in repeatable_instruments]
        except Exception as e:
            results = {'error': "Error: {0}".format(e)}
            response = flask.jsonify(results)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
    else:
        dataDictionaryName = form.get("dataDictionaryName")
        if dataDictionaryName.endswith(".csv"):
            dd_df = pd.read_csv(request.files['dataDictionary'])
            dd_df.fillna('', inplace=True)
        elif dataDictionaryName.endswith(".xlsx") or dataDictionaryName.endswith(".xls"):
            dd_df = pd.read_excel(request.files['dataDictionary'])
        dd_df.columns = utils.parameterize_list(list(dd_df.columns))
        dd = [RedcapField.from_data_dictionary(dd_df, field) for field in list(dd_df['variable_field_name'])]

    cells_with_errors, record_fields_not_in_redcap, all_errors = linter.lint_datafile(dd, records, project_info)
    # with pd.option_context('display.max_rows', None, 'display.max_columns', None):
    #     app.logger.info(cells_with_errors['Sheet1'].iloc[:,0:8])

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
    for sheetName, sheet in records.items():
        csv_headers[sheetName] = list(sheet.columns)
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    results = {
        'csvHeaders': csv_headers,
        'jsonData': json_data,
        'ddHeaders': dd_headers,
        'ddData': dd_data,
        'cellsWithErrors': cells_with_errors,
        'recordFieldsNotInRedcap': record_fields_not_in_redcap,
        'allErrors': all_errors
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
