import flask
from flask import request
import logging
import json
import io
import os
import ntpath
import numbers
import pandas as pd
from datetime import datetime
from collections import OrderedDict
from fuzzywuzzy import fuzz
from flask_cors import CORS, cross_origin
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from linter import linter
from utils import utils
from openpyxl import load_workbook

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)

@app.route('/save_fields', methods=['GET', 'POST', 'OPTIONS'])
def save_fields():
    form  = request.form.to_dict()
    redcap_field_to_data_field_dict = json.loads(form.get('redcapFieldToDataFieldMap'))
    csv_headers = json.loads(form.get('csvHeaders'))
    # data field -> REDCap field
    matched_field_dict = {v: k for k, v in redcap_field_to_data_field_dict.items()}
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)
    records = {}
    for sheet in json_data:
        csv_headers[sheet] = [matched_field_dict.get(c) or c for c in csv_headers[sheet]]
        df = pd.DataFrame(json_data[sheet])
        df.replace('nan', '', inplace=True)
        df = df.rename(index=str, columns=matched_field_dict)
        df = df[csv_headers[sheet]]
        records[sheet] = df

    dd_data = json.loads(form.get('ddData'))
    dd = [RedcapField.from_json(field) for field in dd_data]

    project_info = json.loads(form.get('projectInfo'))

    cells_with_errors, linting_errors = linter.lint_datafile(dd, records, project_info)
    columns_in_error = {}
    for inst in cells_with_errors:
        instrument_columns_in_error = [f for f in list(cells_with_errors[inst].columns) if True in list(cells_with_errors[inst][f])]
        if len(instrument_columns_in_error) > 0:
            columns_in_error[inst] = instrument_columns_in_error

    # Note this will override the previous all errors
    all_errors = linting_errors
    all_errors = [{"Error": error} for error in all_errors]

    json_data   = {}

    for sheetName, sheet in records.items():
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    results = {
        'csvHeaders':              csv_headers,
        'jsonData':                json_data,
        'cellsWithErrors':         cells_with_errors,
        'allErrors':               all_errors,
        'columnsInError':          columns_in_error,
        'page':                    'lint',
        'new':                     False,
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/save_choices', methods=['GET', 'POST', 'OPTIONS'])
def save_choices():
    form  = request.form.to_dict()
    data_field_to_choice_map = json.loads(form.get('dataFieldToChoiceMap'))
    original_to_correct_value_map = json.loads(form.get('originalToCorrectedValueMap'))
    csv_headers = json.loads(form.get('csvHeaders'))
    working_column = json.loads(form.get('workingColumn'))
    working_sheet_name = json.loads(form.get('workingSheetName'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)
    records = {}
    transform_map = data_field_to_choice_map
    if not transform_map:
        transform_map = original_to_correct_value_map
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df.replace('nan', '', inplace=True)
        df = df[csv_headers[sheet]]
        if sheet == working_sheet_name:
            new_list = [transform_map.get(str(f)) or f for f in list(df[working_column])]
            df[working_column] = new_list
        records[sheet] = df

    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    project_info = json.loads(form.get('projectInfo'))

    # TODO Lint specific column
    cells_with_errors, linting_errors = linter.lint_datafile(dd, records, project_info)
    columns_in_error = {}
    for inst in cells_with_errors:
        instrument_columns_in_error = [f for f in list(cells_with_errors[inst].columns) if True in list(cells_with_errors[inst][f])]
        if len(instrument_columns_in_error) > 0:
            columns_in_error[inst] = instrument_columns_in_error

    # Note this will override the previous all errors
    all_errors = linting_errors
    all_errors = [{"Error": error} for error in all_errors]

    json_data   = {}

    for sheetName, sheet in records.items():
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    results = {
        'csvHeaders':              csv_headers,
        'jsonData':                json_data,
        'cellsWithErrors':         cells_with_errors,
        'allErrors':               all_errors,
        'columnsInError':          columns_in_error,
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/resolve_column', methods=['GET', 'POST', 'OPTIONS'])
def resolve_column():
    form  = request.form.to_dict()
    # TODO Take in form param to navigate to any unresolved columns
    csv_headers = json.loads(form.get('csvHeaders'))
    # Working column is the column being saved
    next_column = json.loads(form.get('nextColumn') or '""')
    next_sheet_name = json.loads(form.get('nextSheetName') or '""')
    working_column = json.loads(form.get('workingColumn') or '""')
    working_sheet_name = json.loads(form.get('workingSheetName') or '""')
    data_field_to_choice_map = json.loads(form.get('dataFieldToChoiceMap'))
    original_to_correct_value_map = json.loads(form.get('originalToCorrectedValueMap'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    transform_map = data_field_to_choice_map
    if not transform_map:
        transform_map = original_to_correct_value_map
    records = {}
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df = df[csv_headers[sheet]]
        df.fillna('',inplace=True)
        if sheet == working_sheet_name:
            new_list = [transform_map.get(str(f)) or f for f in list(df[working_column])]
            df[working_column] = new_list
        records[sheet] = df

    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    columns_in_error = json.loads(form.get('columnsInError'))
    project_info = json.loads(form.get('projectInfo'))

    # TODO work on case of no more errors

    # TODO Suggest column changes and simplify this
    next_sheet = False
    for sheet in columns_in_error:
        if next_sheet:
            next_sheet_name = sheet
            next_column = columns_in_error[sheet][0]
        if sheet == working_sheet_name:
            cols_in_error = columns_in_error[sheet]
            if sheet == working_sheet_name and working_column == cols_in_error[-1]:
                next_sheet = True
            elif sheet == working_sheet_name:
                next_sheet_name = sheet
                if working_column not in cols_in_error == -1:
                    next_column = cols_in_error[0]
                else:
                    next_column = cols_in_error[cols_in_error.index(working_column)+1]

    # TODO only remove if errors are resolved
    # if working_sheet_name:
    #     error_cols = columns_in_error[working_sheet_name]
    #     if working_column in error_cols:
    #         error_cols.remove(working_column)
    #         if not error_cols:
    #             del columns_in_error[working_sheet_name]

    field_errors = {}
    if next_column:
        dd_field = [f for f in dd if f.field_name == next_column][0]
        field_errors['fieldType'] = dd_field.field_type
        field_errors['required'] = dd_field.required
        if dd_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox']:
            current_list = list(records[next_sheet_name][next_column])
            if dd_field.field_type in ['yesno', 'truefalse']:
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]
            elif dd_field.field_type in ['radio', 'dropdown', 'checkbox']:
                current_list = [str(int(item)) if isinstance(item, numbers.Number) and float(item).is_integer() else str(item) for item in current_list]
            field_errors['matchedChoices'] = list({r for r in current_list if r in dd_field.choices_dict})
            field_errors['unmatchedChoices'] = list({str(r) for r in current_list if r and r not in dd_field.choices_dict})
            choice_candidates = {}
            for f1 in field_errors['unmatchedChoices']:
                for f2 in dd_field.choices_dict.keys():
                    if not choice_candidates.get(f1):
                        choice_candidates[f1] = []
                    # TODO include form name in this if column name repeats?
                    choice_candidates[f1].append({
                        'candidate': f2,
                        'score': fuzz.ratio(f1, f2)
                    })
            field_errors['choiceCandidates'] = choice_candidates
        if dd_field.field_type in ['text', 'notes']:
            current_list = list(records[next_sheet_name][next_column])
            validations = linter.validate_text_type(current_list, dd_field)
            textErrors = [val for val, valid in zip(current_list, validations) if valid is False]
            field_errors['textErrors']        = textErrors
            field_errors['textValidation']    = dd_field.text_validation
            field_errors['textValidationMin'] = dd_field.text_min
            field_errors['textValidationMax'] = dd_field.text_max

    cells_with_errors, linting_errors = linter.lint_datafile(dd, records, project_info)

    columns_in_error = {}
    for inst in cells_with_errors:
        instrument_columns_in_error = [f for f in list(cells_with_errors[inst].columns) if True in list(cells_with_errors[inst][f])]
        if len(instrument_columns_in_error) > 0:
            columns_in_error[inst] = instrument_columns_in_error

    json_data   = {}

    for sheetName, sheet in records.items():
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    results = {
        'workingColumn':    next_column,
        'workingSheetName': next_sheet_name,
        'jsonData':         json_data,
        'dataFieldToChoiceMap': {},
        'cellsWithErrors':  cells_with_errors,
        'columnsInError':   columns_in_error,
        'fieldErrors':      field_errors,
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/download_progress', methods=['GET', 'POST', 'OPTIONS'])
def download_progress():
    form  = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    redcap_field_to_data_field_dict = json.loads(form.get('redcapFieldToDataFieldMap'))
    csv_headers = json.loads(form.get('csvHeaders'))
    # data field -> REDCap field
    matched_field_dict = {v: k for k, v in redcap_field_to_data_field_dict.items()}
    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Edited.xlsx'
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    for sheet in json_data:
        csv_headers[sheet] = [matched_field_dict.get(c) or c for c in csv_headers[sheet]]
        df = pd.DataFrame(json_data[sheet])
        df.replace('nan', '', inplace=True)
        df.rename(index=str, columns=matched_field_dict, inplace=True)
        df = df[csv_headers[sheet]]
        df.to_excel(writer, sheet_name=sheet, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output,attachment_filename=new_datafile_name,as_attachment=True)

@app.route('/download_output', methods=['GET', 'POST', 'OPTIONS'])
def download_output():
    form  = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    csv_headers = json.loads(form.get('csvHeaders'))
    project_info = json.loads(form.get('projectInfo'))
    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]
    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Encoded.xlsx'
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    records = {}
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df.replace('nan', '', inplace=True)
        df = df[csv_headers[sheet]]
        records[sheet] = df

    output_records = linter.encode_datafile(dd, records, project_info)

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    for sheet, df in output_records.iteritems():
        df.to_excel(writer, sheet_name=sheet, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output,attachment_filename=new_datafile_name,as_attachment=True)

@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def post_form():
    records = pd.read_excel(request.files['dataFile'], sheet_name=None)
    records_with_format = load_workbook(request.files['dataFile'])
    for sheet in records_with_format.sheetnames:
        for row in records_with_format[sheet].iter_rows():
            for cell in row:
                # MRN
                if cell.value in list(records[sheet].columns) and cell.number_format == '00000000':
                    current_list = list(records[sheet][cell.value])
                    current_list = [str(i).rjust(8, '0') if isinstance(i, int) else i for i in current_list]
                    records[sheet][cell.value] = current_list
                if cell.value in list(records[sheet].columns) and cell.number_format == 'mm-dd-yy':
                    current_list = list(records[sheet][cell.value])
                    current_list = [i.strftime('%m/%d/%Y') if isinstance(i, datetime) and not pd.isnull(i) else i for i in current_list]
                    records[sheet][cell.value] = current_list
            break
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
        all_csv_headers = [i for i in all_csv_headers if 'unnamed' not in i]

    all_field_names = [f.field_name for f in dd]

    field_candidates = {}

    all_csv_headers = list(set(all_csv_headers))

    # TODO matches the variable on all sheets, do variables need to be sheet specific?
    matching_headers = list(set(all_field_names) & set(all_csv_headers))
    unmatched_redcap_fields = [f for f in all_field_names if f not in all_csv_headers]
    fields_not_in_redcap = [f for f in all_csv_headers if f not in all_field_names]
    for f1 in unmatched_redcap_fields:
        for f2 in fields_not_in_redcap:
            if not field_candidates.get(f1):
                field_candidates[f1] = []
            # TODO include form name in this if column name repeats?
            field_candidates[f1].append({
                'candidate': f2,
                'score': fuzz.ratio(f1, f2)
            })

    # TODO Make the code below a separate endpoint for after the headers are matched.

    all_errors                  = []
    # sheets_not_in_redcap        = []
    record_fields_not_in_redcap = {}
    recordid_field              = dd[0]
    form_names = [redcap_field.form_name for redcap_field in dd]
    form_names = list(set(form_names))
    for instrument in records.keys():
        sheet_name = utils.parameterize(instrument)
        instrument_records = records.get(instrument)

        # Uncomment if sheet name must match instrument name
        # if sheet_name not in form_names:
        #     sheets_not_in_redcap.append(instrument)
        #     all_errors.append("Sheet {0} not found in form names of data dictionary.".format(instrument))
        #     continue

        instrument_records.columns = utils.parameterize_list(list(instrument_records.columns))

        # Commented out line assumes that the sheet name matches form name in data Dictionary
        # and only compares the columns in that form.
        # [field for field in dd if field.form_name == sheet_name or field.field_name == recordid_field.field_name]
        form_fields = dd

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
        # 'sheetsNotInRedcap':       sheets_not_in_redcap,
        'formNames':               form_names,
        'projectInfo':             project_info,
        'matchingHeaders':         matching_headers,
        'fieldCandidates':         field_candidates,
        'unmatchedRedcapFields':   unmatched_redcap_fields,
        'dataFileName':            datafile_name,
        'page':                    'matchFields',
        'new':                     True
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
