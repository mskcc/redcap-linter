import flask
from flask import request
import logging
import json
import io
import os
import ntpath
import pandas as pd
from datetime import datetime
from fuzzywuzzy import fuzz
from flask_cors import CORS, cross_origin
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from linter import linter
from utils import utils

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)

@app.route('/save_fields', methods=['GET', 'POST', 'OPTIONS'])
def save_fields():
    form  = request.form.to_dict()
    redcap_field_to_data_field_dict = json.loads(form.get('redcapFieldToDataFieldMap'))
    # data field -> REDCap field
    matched_field_dict = {v: k for k, v in redcap_field_to_data_field_dict.items()}
    json_data = json.loads(form.get('jsonData'))
    records = {}
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df.rename(index=str, columns=matched_field_dict, inplace=True)
        records[sheet] = df

    dd_data = json.loads(form.get('ddData'))
    dd = [RedcapField.from_json(field) for field in dd_data]
    # for field in dd:
    #     app.logger.info(field.field_name)
    #     app.logger.info(field.form_name)

    project_info = json.loads(form.get('projectInfo'))
    app.logger.info(project_info)

    results = {'error': "Error"}
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/download_progress', methods=['GET', 'POST', 'OPTIONS'])
def download_progress():
    form  = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    redcap_field_to_data_field_dict = json.loads(form.get('redcapFieldToDataFieldMap'))
    # data field -> REDCap field
    matched_field_dict = {v: k for k, v in redcap_field_to_data_field_dict.items()}
    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Edited.xlsx'
    json_data = json.loads(form.get('jsonData'))
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df.rename(index=str, columns=matched_field_dict, inplace=True)
        df.to_excel(writer, sheet_name=sheet, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output,attachment_filename=new_datafile_name,as_attachment=True)

@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def post_form():
    records = pd.read_excel(request.files['dataFile'], sheet_name=None)
    for key in records:
        records.get(key).replace('nan', '', inplace=True)
    form  = request.form.to_dict()
    token = form.get('token')
    env   = form.get('environment')
    ri    = form.get('repeatableInstruments')
    datafile_name = form.get('dataFileName')

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
        dataDictionaryName = form.get('dataDictionaryName')
        if dataDictionaryName.endswith('.csv'):
            dd_df = pd.read_csv(request.files['dataDictionary'])
            dd_df.fillna('', inplace=True)
        elif dataDictionaryName.endswith('.xlsx') or dataDictionaryName.endswith('.xls'):
            dd_df = pd.read_excel(request.files['dataDictionary'])
        dd_df.columns = utils.parameterize_list(list(dd_df.columns))
        dd = [RedcapField.from_data_dictionary(dd_df, field) for field in list(dd_df['variable_field_name'])]

    all_csv_headers = []
    dd_headers  = []
    dd_data     = {}
    if data_dictionary is not None:
        dd_headers = data_dictionary[0].keys()
        dd_data = data_dictionary
    else:
        dd_headers = list(dd_df.columns)
        dd_data = json.loads(dd_df.to_json(orient='records'))

    for sheetName, sheet in records.items():
        all_csv_headers += utils.parameterize_list(list(sheet.columns))

    all_field_names = [f.field_name for f in dd]

    field_candidates = {}

    matching_headers = list(set(all_field_names) & set(all_csv_headers))
    unmatched_redcap_fields = [f for f in all_field_names if f not in all_csv_headers]
    fields_not_in_redcap = [f for f in all_csv_headers if f not in all_field_names]
    for f1 in unmatched_redcap_fields:
        for f2 in fields_not_in_redcap:
            if not field_candidates.get(f1):
                field_candidates[f1] = []
            field_candidates[f1].append({
                'candidate': f2,
                'score': fuzz.ratio(f1, f2)
            })

    # TODO Make the code below a separate endpoint for after the headers are matched.

    all_errors                  = []
    sheets_not_in_redcap        = []
    record_fields_not_in_redcap = {}
    recordid_field              = dd[0]
    form_names = [redcap_field.form_name for redcap_field in dd]
    form_names = list(set(form_names))
    for instrument in records.keys():
        sheet_name = utils.parameterize(instrument)
        instrument_records = records.get(instrument)

        if sheet_name not in form_names:
            sheets_not_in_redcap.append(instrument)
            all_errors.append("Sheet {0} not found in form names of data dictionary.".format(instrument))
            continue

        instrument_records.columns = utils.parameterize_list(list(instrument_records.columns))
        form_fields = [field for field in dd if field.form_name == sheet_name or field.field_name == recordid_field.field_name]

        redcap_field_names = [field.field_name for field in form_fields]

        redcap_fields_not_in_data = [field for field in redcap_field_names if field not in instrument_records.columns]

        instrument_fields_not_in_redcap = [field for field in instrument_records.columns if field not in redcap_field_names]
        record_fields_not_in_redcap[instrument] = instrument_fields_not_in_redcap

        if len(instrument_fields_not_in_redcap) > 0:
            all_errors.append("Fields in Instrument {0} not present in REDCap: {1}".format(instrument, str(instrument_fields_not_in_redcap)))
        if len(redcap_fields_not_in_data) > 0:
            all_errors.append("Fields in REDCap not present in Instrument {0}: {1}".format(instrument, str(redcap_fields_not_in_data)))

    recordid_instrument = recordid_field.form_name
    recordid_instrument_records = records.get(recordid_instrument) or records.get(recordid_instrument.title())
    if recordid_instrument_records is None:
        error_msg = ("Record ID Instrument `{0}` not found in datafile. "
                     "Please make sure sheets are named with the same instrument (form) name as it appears in "
                     "REDCap or the Data Dictionary.").format(recordid_instrument)
        all_errors.append(error_msg)

    cells_with_errors, linting_errors = linter.lint_datafile(dd, records, project_info)
    all_errors += linting_errors
    all_errors = [{"Error": error} for error in all_errors]
    # with pd.option_context('display.max_rows', None, 'display.max_columns', None):
    #     app.logger.info(cells_with_errors['Sheet1'].iloc[:,0:8])

    csv_headers = {}
    json_data   = {}

    for sheetName, sheet in records.items():
        csv_headers[sheetName] = list(sheet.columns)
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    results = {
        'csvHeaders':              csv_headers,
        'jsonData':                json_data,
        'ddHeaders':               dd_headers,
        'ddData':                  dd_data,
        'cellsWithErrors':         cells_with_errors,
        'recordFieldsNotInRedcap': record_fields_not_in_redcap,
        'allErrors':               all_errors,
        'sheetsNotInRedcap':       sheets_not_in_redcap,
        'formNames':               form_names,
        'projectInfo':             project_info,
        'matchingHeaders':         matching_headers,
        'fieldCandidates':         field_candidates,
        'unmatchedRedcapFields':   unmatched_redcap_fields,
        'dataFileName':            datafile_name,
        'page':                    'matchFields'
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
