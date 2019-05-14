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
import collections
from fuzzywuzzy import fuzz
from flask_cors import CORS, cross_origin
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from linter import linter
from utils import utils
from serializers import serializer
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
import textwrap

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)

# TODO Remove from Selected Columns once saved
@app.route('/save_fields', methods=['GET', 'POST', 'OPTIONS'])
def save_fields():
    form  = request.form.to_dict()
    data_field_to_redcap_field_map = json.loads(form.get('dataFieldToRedcapFieldMap'))
    matched_field_map = json.loads(form.get('matchedFieldMap'))
    csv_headers = json.loads(form.get('csvHeaders'))
    existing_records = json.loads(form.get('existingRecords'))
    recordid_field = json.loads(form.get('recordidField'))
    malformed_sheets = json.loads(form.get('malformedSheets') or '""')
    date_cols = json.loads(form.get('dateColumns'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)
    records = {}
    for sheet in json_data:
        matched_field_dict = data_field_to_redcap_field_map.get(sheet) or {}
        # for data_field in matched_field_dict.keys():
        #     if selected_columns.get(sheet) and data_field in selected_columns.get(sheet):
        #         selected_columns.get(sheet).remove(data_field)
        csv_headers[sheet] = [matched_field_dict.get(c) or c for c in csv_headers[sheet] if c not in matched_field_dict or matched_field_dict.get(c)]
        fields_to_drop = [data_field for data_field in matched_field_dict.keys() if not matched_field_dict.get(data_field)]
        df = pd.DataFrame(json_data[sheet])
        df.fillna('', inplace=True)
        df = df.rename(index=str, columns=matched_field_dict)
        df = df[csv_headers[sheet]]
        records[sheet] = df

    dd_data = json.loads(form.get('ddData'))
    dd = [RedcapField.from_json(field) for field in dd_data]

    project_info = json.loads(form.get('projectInfo'))

    datafile_errors = linter.lint_datafile(dd, records, project_info)
    cells_with_errors = datafile_errors['cells_with_errors']
    rows_in_error = datafile_errors['rows_in_error']
    encoded_records = datafile_errors['encoded_records']

    columns_in_error = utils.get_columns_with_errors(cells_with_errors, records)

    all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]

    json_data   = {}
    output_records = {}

    # logging.warning(encoded_records)
    for sheet_name, sheet in records.items():
        json_data[sheet_name] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheet_name] = json.loads(cells_with_errors[sheet_name].to_json(orient='records'))

    for sheet_name in encoded_records:
        if malformed_sheets and sheet_name in malformed_sheets:
            continue
        output_records[sheet_name] = json.loads(encoded_records[sheet_name].to_json(orient='records'))

    records_to_reconcile = {}
    if existing_records:
        for record in existing_records:
            if not record['redcap_repeat_instrument']:
                records_to_reconcile[record[recordid_field]] = record

    # TODO Get list of rows with merge conflicts
    merge_conflicts = {}
    decoded_records = {}

    for sheet_name in records.keys():
        merge_conflicts[sheet_name] = []
        sheet = records.get(sheet_name)
        for index, row in sheet.iterrows():
            if row.get(recordid_field):
                if isinstance(row.get(recordid_field), float) and row.get(recordid_field).is_integer():
                    # Excel reads this in as a float :/
                    recordid = str(int(row[recordid_field]))
                    if records_to_reconcile.get(recordid):
                        # TODO Logic to determine if there is a merge conflict
                        merge_conflicts[sheet_name].append(int(index))
                        decoded_row = serializer.decode_sheet(dd, project_info, records_to_reconcile.get(recordid))
                        decoded_records[recordid] = decoded_row

    results = {
        'jsonData':                   json_data,
        'rowsInError':                rows_in_error,
        'cellsWithErrors':            cells_with_errors,
        'allErrors':                  all_errors,
        'csvHeaders':                 csv_headers,
        'columnsInError':             columns_in_error,
        'encodedRecords':             output_records,
        'decodedRecords':             decoded_records,
        'mergeConflicts':             merge_conflicts,
        'fieldsSaved':                True,
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
    action = json.loads(form.get('action') or '""')
    next_column = json.loads(form.get('nextColumn') or '""')
    next_sheet_name = json.loads(form.get('nextSheetName') or '""')
    working_column = json.loads(form.get('workingColumn') or '""')
    working_sheet_name = json.loads(form.get('workingSheetName') or '""')
    malformed_sheets = json.loads(form.get('malformedSheets') or '""')
    data_field_to_choice_map = json.loads(form.get('dataFieldToChoiceMap'))
    original_to_correct_value_map = json.loads(form.get('originalToCorrectedValueMap'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    choice_map = {}
    if working_sheet_name in data_field_to_choice_map and working_column in data_field_to_choice_map[working_sheet_name]:
        choice_map = data_field_to_choice_map[working_sheet_name][working_column]

    value_map = {}
    if working_sheet_name in original_to_correct_value_map and working_column in original_to_correct_value_map[working_sheet_name]:
        value_map = original_to_correct_value_map[working_sheet_name][working_column]

    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    transform_map = choice_map
    if not transform_map:
        transform_map = value_map
    records = {}
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df = df[csv_headers[sheet]]
        df.fillna('',inplace=True)
        if sheet == working_sheet_name:
            dd_field = [f for f in dd if f.field_name == working_column][0]
            new_list = []
            for f in list(df[working_column]):
                new_value = transform_map.get(str(f)) or f
                if isinstance(new_value, list):
                    new_value = ', '.join([str(i) for i in new_value])
                new_list.append(new_value)
            df[working_column] = new_list
        records[sheet] = df

    columns_in_error = json.loads(form.get('columnsInError'))
    rows_in_error = json.loads(form.get('rowsInError'))
    project_info = json.loads(form.get('projectInfo'))

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
                if working_column not in cols_in_error:
                    next_column = cols_in_error[0]
                else:
                    next_column = cols_in_error[cols_in_error.index(working_column)+1]

    next_row = None
    if not next_column:
        for sheet in rows_in_error:
            if len(rows_in_error[sheet]) > 0:
                next_sheet_name = sheet
                next_row = rows_in_error[sheet][0]

    field_errors = {}
    if next_column:
        dd_field = [f for f in dd if f.field_name == next_column][0]
        field_errors['fieldType'] = dd_field.field_type
        field_errors['required'] = dd_field.required
        if dd_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox']:
            current_list = list(records[next_sheet_name][next_column])
            if dd_field.field_type in ['yesno', 'truefalse']:
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]
                field_errors['matchedChoices'] = list({r for r in current_list if r in dd_field.choices_dict})
                field_errors['unmatchedChoices'] = list({str(r) for r in current_list if r and r not in dd_field.choices_dict})
            elif dd_field.field_type in ['radio', 'dropdown']:
                current_list = [str(int(item)) if isinstance(item, numbers.Number) and float(item).is_integer() else str(item) for item in current_list]
                field_errors['matchedChoices'] = list({r for r in current_list if r in dd_field.choices_dict})
                field_errors['unmatchedChoices'] = list({str(r) for r in current_list if r and r not in dd_field.choices_dict})
            elif dd_field.field_type in ['checkbox']:
                field_errors['matchedChoices'] = set()
                field_errors['unmatchedChoices'] = set()
                permissible_values = map(str.lower, map(str, dd_field.choices_dict.keys()))
                for item in current_list:
                    if not item:
                        continue
                    checkbox_items = [i.strip() for i in item.split(',')]
                    # At least 1 item not in the Permissible Values
                    if True in [str(i).lower() not in permissible_values for i in checkbox_items]:
                        field_errors['unmatchedChoices'].add(item)
                    else:
                        field_errors['matchedChoices'].add(item)
                field_errors['matchedChoices'] = list(field_errors['matchedChoices'])
                field_errors['unmatchedChoices'] = list(field_errors['unmatchedChoices'])
            choice_candidates = {}
            for f1 in field_errors['unmatchedChoices']:
                for f2 in dd_field.choices_dict:
                    if not choice_candidates.get(f1):
                        choice_candidates[f1] = []
                    # TODO include form name in this if column name repeats?
                    choice_candidates[f1].append({
                        'candidate': f2,
                        'choiceValue': dd_field.choices_dict[f2],
                        'score': fuzz.ratio(f1, f2)
                    })
            field_errors['choiceCandidates'] = choice_candidates
        if dd_field.field_type in ['text', 'notes']:
            current_list = list(records[next_sheet_name][next_column])
            validations = utils.validate_text_type(current_list, dd_field)
            textErrors = [val for val, valid in zip(current_list, validations) if val and valid is False]
            field_errors['textErrors']        = textErrors
            field_errors['textValidation']    = dd_field.text_validation
            field_errors['textValidationMin'] = dd_field.text_min
            field_errors['textValidationMax'] = dd_field.text_max

    # TODO Add encoded records to the response

    datafile_errors = linter.lint_datafile(dd, records, project_info)
    cells_with_errors = datafile_errors['cells_with_errors']
    rows_in_error = datafile_errors['rows_in_error']
    encoded_records = datafile_errors['encoded_records']

    columns_in_error = utils.get_columns_with_errors(cells_with_errors, records)

    json_data   = {}
    output_records = {}

    all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]

    for sheetName, sheet in records.items():
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    for sheet_name in encoded_records:
        if malformed_sheets and sheet_name in malformed_sheets:
            continue
        output_records[sheet_name] = json.loads(encoded_records[sheet_name].to_json(orient='records'))

    results = {
        'jsonData':        json_data,
        'cellsWithErrors': cells_with_errors,
        'columnsInError':  columns_in_error,
        'allErrors':       all_errors,
        'rowsInError':     rows_in_error,
        'encodedRecords':  output_records,
    }
    if action == 'continue':
        results['workingColumn'] = next_column
        results['workingSheetName'] = next_sheet_name
        results['fieldErrors'] = field_errors
        if next_row:
            results['workingRow'] = next_row

    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/resolve_row', methods=['GET', 'POST', 'OPTIONS'])
def resolve_row():
    form  = request.form.to_dict()
    csv_headers = json.loads(form.get('csvHeaders'))
    # Working column is the column being saved
    action = json.loads(form.get('action') or '""')
    next_row = json.loads(form.get('nextRow') or '')
    next_sheet_name = json.loads(form.get('nextSheetName') or '""')
    working_row = json.loads(form.get('workingRow') or '""')
    working_sheet_name = json.loads(form.get('workingSheetName') or '""')
    malformed_sheets = json.loads(form.get('malformedSheets') or '""')
    field_to_value_map = json.loads(form.get('fieldToValueMap'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    value_map = {}
    if working_sheet_name in field_to_value_map and str(working_row) in field_to_value_map[working_sheet_name]:
        value_map = field_to_value_map[working_sheet_name][str(working_row)]

    records = {}
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df = df[csv_headers[sheet]]
        df.fillna('',inplace=True)
        if sheet == working_sheet_name:
            for field in value_map:
                dd_field = [f for f in dd if f.field_name == field][0]
                value = value_map[field]
                if dd_field.text_validation == 'integer':
                    value = int(value) if value else value
                elif dd_field.text_validation == 'number_2dp':
                    value = float(value) if value else value
                df.iloc[working_row, df.columns.get_loc(field)] = value
        records[sheet] = df

    columns_in_error = json.loads(form.get('columnsInError'))
    rows_in_error = json.loads(form.get('rowsInError'))
    project_info = json.loads(form.get('projectInfo'))

    next_sheet = False
    for sheet in rows_in_error:
        if next_sheet:
            next_sheet_name = sheet
            next_row = rows_in_error[sheet][0]
        if sheet == working_sheet_name:
            sheet_rows_in_error = rows_in_error[sheet]
            if sheet == working_sheet_name and working_row == sheet_rows_in_error[-1]:
                next_sheet = True
            elif sheet == working_sheet_name:
                next_sheet_name = sheet
                if working_row not in sheet_rows_in_error:
                    next_row = sheet_rows_in_error[0]
                else:
                    next_row = sheet_rows_in_error[sheet_rows_in_error.index(working_row)+1]

    next_column = None
    if next_row == '':
        for sheet in columns_in_error:
            if len(columns_in_error[sheet]) > 0:
                next_sheet_name = sheet
                next_column = columns_in_error[sheet][0]

    field_errors = {}
    if next_column:
        dd_field = [f for f in dd if f.field_name == next_column][0]
        field_errors['fieldType'] = dd_field.field_type
        field_errors['required'] = dd_field.required
        if dd_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox']:
            current_list = list(records[next_sheet_name][next_column])
            if dd_field.field_type in ['yesno', 'truefalse']:
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]
                field_errors['matchedChoices'] = list({r for r in current_list if r in dd_field.choices_dict})
                field_errors['unmatchedChoices'] = list({str(r) for r in current_list if r and r not in dd_field.choices_dict})
            elif dd_field.field_type in ['radio', 'dropdown']:
                current_list = [str(int(item)) if isinstance(item, numbers.Number) and float(item).is_integer() else str(item) for item in current_list]
                field_errors['matchedChoices'] = list({r for r in current_list if r in dd_field.choices_dict})
                field_errors['unmatchedChoices'] = list({str(r) for r in current_list if r and r not in dd_field.choices_dict})
            elif dd_field.field_type in ['checkbox']:
                field_errors['matchedChoices'] = set()
                field_errors['unmatchedChoices'] = set()
                permissible_values = map(str.lower, map(str, dd_field.choices_dict.keys()))
                for item in current_list:
                    if not item:
                        continue
                    checkbox_items = [i.strip() for i in item.split(',')]
                    # At least 1 item not in the Permissible Values
                    if True in [str(i).lower() not in permissible_values for i in checkbox_items]:
                        field_errors['unmatchedChoices'].add(item)
                    else:
                        field_errors['matchedChoices'].add(item)
                field_errors['matchedChoices'] = list(field_errors['matchedChoices'])
                field_errors['unmatchedChoices'] = list(field_errors['unmatchedChoices'])
            choice_candidates = {}
            for f1 in field_errors['unmatchedChoices']:
                for f2 in dd_field.choices_dict:
                    if not choice_candidates.get(f1):
                        choice_candidates[f1] = []
                    choice_candidates[f1].append({
                        'candidate': f2,
                        'choiceValue': dd_field.choices_dict[f2],
                        'score': fuzz.ratio(f1, f2)
                    })
            field_errors['choiceCandidates'] = choice_candidates
        if dd_field.field_type in ['text', 'notes']:
            current_list = list(records[next_sheet_name][next_column])
            validations = utils.validate_text_type(current_list, dd_field)
            textErrors = [val for val, valid in zip(current_list, validations) if val and valid is False]
            field_errors['textErrors']        = textErrors
            field_errors['textValidation']    = dd_field.text_validation
            field_errors['textValidationMin'] = dd_field.text_min
            field_errors['textValidationMax'] = dd_field.text_max

    datafile_errors = linter.lint_datafile(dd, records, project_info)
    cells_with_errors = datafile_errors['cells_with_errors']
    rows_in_error = datafile_errors['rows_in_error']
    encoded_records = datafile_errors['encoded_records']

    all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]

    json_data   = {}
    output_records = {}

    for sheetName, sheet in records.items():
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    for sheet_name in encoded_records:
        # logging.warning(malformed_sheets)
        if malformed_sheets and sheet_name in malformed_sheets:
            continue
        output_records[sheet_name] = json.loads(encoded_records[sheet_name].to_json(orient='records'))

    results = {
        'jsonData':         json_data,
        'allErrors':        all_errors,
        'rowsInError':      rows_in_error,
        'cellsWithErrors':  cells_with_errors,
        'encodedRecords':   output_records,
    }
    if action == 'continue':
        results['workingRow'] = next_row
        results['workingSheetName'] = next_sheet_name
        results['fieldErrors'] = {}
        if next_column:
            results['workingColumn'] = next_column
            results['fieldErrors'] = field_errors
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/resolve_merge_row', methods=['GET', 'POST', 'OPTIONS'])
def resolve_merge_row():
    form  = request.form.to_dict()
    csv_headers = json.loads(form.get('csvHeaders'))
    # Working column is the column being saved
    action = json.loads(form.get('action') or '""')
    next_merge_row = json.loads(form.get('nextMergeRow') or '""')
    next_sheet_name = json.loads(form.get('nextSheetName') or '""')
    working_merge_row = json.loads(form.get('workingMergeRow') or '""')
    working_sheet_name = json.loads(form.get('workingSheetName') or '""')
    malformed_sheets = json.loads(form.get('malformedSheets') or '""')
    merge_map = json.loads(form.get('mergeMap'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]


    row_merge_map = {}
    if working_sheet_name in merge_map and str(working_merge_row) in merge_map[working_sheet_name]:
        row_merge_map = merge_map[working_sheet_name].get(str(working_merge_row))

    records = {}
    for sheet in json_data:
        df = pd.DataFrame(json_data[sheet])
        df = df[csv_headers[sheet]]
        df.fillna('',inplace=True)
        if sheet == working_sheet_name:
            for field in row_merge_map:
                dd_field = [f for f in dd if f.field_name == field][0]
                value = row_merge_map[field]
                if dd_field.text_validation == 'integer':
                    value = int(value) if value else value
                elif dd_field.text_validation == 'number_2dp':
                    value = float(value) if value else value
                df.iloc[working_merge_row, df.columns.get_loc(field)] = value
        records[sheet] = df

    merge_conflicts = json.loads(form.get('mergeConflicts'))
    project_info = json.loads(form.get('projectInfo'))

    next_sheet = False
    for sheet in merge_conflicts:
        if next_sheet and merge_conflicts[sheet]:
            next_sheet_name = sheet
            next_merge_row = merge_conflicts[sheet][0]
        if sheet == working_sheet_name:
            sheet_merge_conflicts = merge_conflicts[sheet]
            if sheet == working_sheet_name and working_merge_row == sheet_merge_conflicts[-1]:
                next_sheet = True
            elif sheet == working_sheet_name:
                next_sheet_name = sheet
                if working_merge_row not in sheet_merge_conflicts:
                    next_merge_row = sheet_merge_conflicts[0]
                else:
                    next_merge_row = sheet_merge_conflicts[sheet_merge_conflicts.index(working_merge_row)+1]

    if working_sheet_name and merge_conflicts and merge_conflicts[working_sheet_name]:
        merge_conflicts[working_sheet_name].remove(working_merge_row)

    datafile_errors = linter.lint_datafile(dd, records, project_info)
    cells_with_errors = datafile_errors['cells_with_errors']
    rows_in_error = datafile_errors['rows_in_error']
    encoded_records = datafile_errors['encoded_records']

    all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]

    json_data   = {}
    output_records = {}

    for sheetName, sheet in records.items():
        json_data[sheetName] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheetName] = json.loads(cells_with_errors[sheetName].to_json(orient='records'))

    for sheet_name in encoded_records:
        if malformed_sheets and sheet_name in malformed_sheets:
            continue
        output_records[sheet_name] = json.loads(encoded_records[sheet_name].to_json(orient='records'))

    results = {
        'jsonData':         json_data,
        'allErrors':        all_errors,
        'mergeConflicts':   merge_conflicts,
        'cellsWithErrors':  cells_with_errors,
        'encodedRecords':   output_records,
    }
    if action == 'continue':
        results['workingMergeRow'] = next_merge_row
        results['workingSheetName'] = next_sheet_name
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/import_records', methods=['GET', 'POST', 'OPTIONS'])
def import_records():
    form  = request.form.to_dict()
    encoded_records = json.loads(form.get('encodedRecords'))

    env = json.loads(form.get('env'))
    token = json.loads(form.get('token'))
    redcap_api = RedcapApi(env)

    errors = {}
    for sheet_name, sheet_records in encoded_records.items():
        r = redcap_api.import_records(token, sheet_records)
        errors[sheet_name] = r

    results = {
        'importErrors': errors
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/download_progress', methods=['GET', 'POST', 'OPTIONS'])
def download_progress():
    form  = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    data_field_to_redcap_field_map = json.loads(form.get('dataFieldToRedcapFieldMap'))
    csv_headers = json.loads(form.get('csvHeaders'))
    dd = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]
    cells_with_errors = json.loads(form.get('cellsWithErrors'))
    record_fields_not_in_redcap = json.loads(form.get('recordFieldsNotInRedcap'))

    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Edited.xlsx'
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')

    error_format = writer.book.add_format({'bg_color': '#ffbf00'}) # Amber
    empty_format = writer.book.add_format({'bg_color': '#FFE300'}) # Yellow
    missing_column_format = writer.book.add_format({'bg_color': '#E5153E'}) # Red
    for sheet in json_data:
        matched_field_dict = data_field_to_redcap_field_map.get(sheet) or {}
        csv_headers[sheet] = [matched_field_dict.get(c) or c for c in csv_headers[sheet]]
        error_df = pd.DataFrame(cells_with_errors[sheet])
        df = pd.DataFrame(json_data[sheet])
        df.fillna('', inplace=True)
        df.rename(columns=matched_field_dict, inplace=True)
        error_df.rename(columns=matched_field_dict, inplace=True)
        df = df[csv_headers[sheet]]
        error_df = error_df[csv_headers[sheet]]
        df.to_excel(writer, sheet_name=sheet, index=False)

        instrument_fields_not_in_redcap = record_fields_not_in_redcap[sheet]

        data_worksheet = writer.sheets[sheet]
        for j, col in enumerate(error_df.columns):
            if instrument_fields_not_in_redcap is not None and col in instrument_fields_not_in_redcap:
                data_worksheet.write(0, j, df.columns[j], missing_column_format)
                continue
            for index, row in error_df.iterrows():
                error_cell = error_df.iloc[index][col]
                required = False
                dd_field = [f for f in dd if f.field_name == col]
                if dd_field:
                    required = dd_field[0].required
                if error_cell is None and required:
                    data_worksheet.write(index + 1, j, '', empty_format)
                elif error_cell:
                    cell = df.iloc[index][df.columns[j]]
                    target_string = cell or ''
                    cell_format = None
                    if cell:
                        cell_format = error_format
                    elif required:
                        cell_format = empty_format
                    data_worksheet.write(index + 1, j, target_string, cell_format)
    writer.close()
    output.seek(0)
    return flask.send_file(output,attachment_filename=new_datafile_name,as_attachment=True)

@app.route('/download_mappings', methods=['GET', 'POST', 'OPTIONS'])
def download_mappings():
    form  = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    data_field_to_redcap_field_map = json.loads(form.get('dataFieldToRedcapFieldMap'))
    data_field_to_choice_map = json.loads(form.get('dataFieldToChoiceMap'))
    original_to_correct_value_map = json.loads(form.get('originalToCorrectedValueMap'))
    no_match_redcap_fields = json.loads(form.get('noMatchRedcapFields'))

    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Mappings.xlsx'

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')

    wb  = writer.book

    df = pd.DataFrame({'dataFieldToRedcapFieldMap': [json.dumps(data_field_to_redcap_field_map)],
                        'dataFieldToChoiceMap': [json.dumps(data_field_to_choice_map)],
                        'originalToCorrectedValueMap': [json.dumps(original_to_correct_value_map)],
                        'noMatchRedcapFields': [json.dumps(no_match_redcap_fields)]})

    df.to_excel(writer, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output,attachment_filename=new_datafile_name,as_attachment=True)

@app.route('/download_output', methods=['GET', 'POST', 'OPTIONS'])
def download_output():
    form  = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    csv_headers = json.loads(form.get('csvHeaders'))
    project_info = json.loads(form.get('projectInfo'))
    malformed_sheets = json.loads(form.get('malformedSheets') or '""')
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

    # TODO Merge the different sheets
    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    for sheet, form in output_records.items():
        if sheet in malformed_sheets:
            continue
        form.to_excel(writer, sheet_name=sheet, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output,attachment_filename=new_datafile_name,as_attachment=True)

@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def post_form():
    records = pd.read_excel(request.files['dataFile'], sheet_name=None)
    # TODO replace nan here, change this to go through all cells and modify with number_format
    date_cols = []
    records_with_format = load_workbook(request.files['dataFile'])
    for sheet in records_with_format.sheetnames:
        for row in records_with_format[sheet].iter_rows(min_row=2):
            for cell in row:
                # MRN
                column_header = records_with_format[sheet][get_column_letter(cell.column) + '1'].value
                if column_header in list(records[sheet].columns) and cell.number_format == '00000000':
                    current_list = list(records[sheet][column_header])
                    current_list = [str(i).rjust(8, '0') if isinstance(i, int) else i for i in current_list]
                    records[sheet][column_header] = current_list
                if column_header in list(records[sheet].columns) and cell.number_format == 'mm-dd-yy':
                    date_cols.append(column_header)
                    current_list = list(records[sheet][column_header])
                    current_list = [i.strftime('%m/%d/%Y') if isinstance(i, datetime) and not pd.isnull(i) else i for i in current_list]
                    records[sheet][column_header] = current_list
            break

    form  = request.form.to_dict()
    token = form.get('token')
    env   = form.get('environment')
    datafile_name = form.get('dataFileName')
    mappings_file_name = None
    mappings = None
    existing_records_file_name = None
    existing_records = None
    form_names = set()
    form_name_to_dd_fields = {}
    data_field_to_redcap_field_map = {}
    data_field_to_choice_map = {}
    original_to_correct_value_map = {}
    no_match_redcap_fields = []

    if 'mappingsFile' in request.files:
        mappings_file_name = form.get('mappingsFileName')
        mappings =  pd.read_excel(request.files['mappingsFile'], sheet_name="Sheet1")

        if len(list(mappings["dataFieldToRedcapFieldMap"])) > 0:
            data_field_to_redcap_field_map = json.loads(list(mappings["dataFieldToRedcapFieldMap"])[0])
        if len(list(mappings["dataFieldToChoiceMap"])) > 0:
            data_field_to_choice_map = json.loads(list(mappings["dataFieldToChoiceMap"])[0])
        if len(list(mappings["originalToCorrectedValueMap"])) > 0:
            original_to_correct_value_map = json.loads(list(mappings["originalToCorrectedValueMap"])[0])
        if len(list(mappings["noMatchRedcapFields"])) > 0:
            no_match_redcap_fields = json.loads(list(mappings["noMatchRedcapFields"])[0])

    redcap_api = RedcapApi(env)

    project_info = {
        'custom_record_label': '',
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 0,
        'repeatable_instruments': [],
        'next_record_name': 1
    }

    data_dictionary = None
    if token:
        try:
            existing_records = redcap_api.export_records(token)
            data_dictionary = redcap_api.fetch_data_dictionary(token)
            project_info = redcap_api.fetch_project_info(token)
            project_info['next_record_name'] = redcap_api.generate_next_record_name(token)
            if project_info['has_repeating_instruments_or_events'] == 1:
                repeatable_instruments = redcap_api.fetch_repeatable_instruments(token)
                project_info['repeatable_instruments'] = [i['form_name'] for i in repeatable_instruments]
            if project_info['record_autonumbering_enabled'] == 0:
                data_dictionary[0]['required'] = 'Y'
            dd = [RedcapField.from_json(field) for field in data_dictionary]
        except Exception as e:
            logging.warning(e)
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
        dd = [RedcapField.from_data_dictionary(dd_df, field) for field in list(dd_df['Variable / Field Name'])]
        if 'existingRecordsFile' in request.files:
            existing_records_file_name = form.get('existingRecordsFileName')
            existing_records =  pd.read_csv(request.files['existingRecordsFile'])
            existing_records = json.loads(existing_records.to_json(orient='records', date_format='iso'))

    all_csv_headers = []
    dd_headers  = []
    dd_data     = {}
    dd_data_raw = {}
    if data_dictionary is not None:
        dd_headers = list(data_dictionary[0].keys())
        dd_data_raw = data_dictionary
    else:
        dd_headers = list(dd_df.columns)
        dd_data_raw = json.loads(dd_df.to_json(orient='records', date_format='iso'))

    dd_data = [field.__dict__ for field in dd]

    for dd_field in dd:
        if not form_name_to_dd_fields.get(dd_field.form_name):
            form_name_to_dd_fields[dd_field.form_name] = []
        form_name_to_dd_fields.get(dd_field.form_name).append(dd_field.field_name)
        form_names.add(dd_field.form_name)

    recordid_field = 'recordid'
    if not project_info.get('record_autonumbering_enabled'):
        recordid_field = dd[0].field_name

    form_names = list(form_names)

    for sheet_name, sheet in records.items():
        all_csv_headers += list(sheet.columns)
        all_csv_headers = [i for i in all_csv_headers if 'Unnamed' not in i]

    all_field_names = [f.field_name for f in dd]

    redcap_field_candidates = {}
    data_field_candidates = {}
    csv_headers = {}
    fields_not_in_redcap = {}
    duplicate_fields = {}

    for sheet_name, sheet in records.items():
        duplicate_fields[sheet_name] = {}
        # Remove empty rows
        sheet.dropna(axis=0, how='all', inplace=True)
        csv_headers[sheet_name] = list(sheet.columns)
        csv_headers[sheet_name] = [item for item in csv_headers[sheet_name] if 'Unnamed' not in item]
        for header in csv_headers[sheet_name]:
            if not duplicate_fields[sheet_name].get(header):
                duplicate_fields[sheet_name][header] = 1
            else:
                duplicate_fields[sheet_name][header] += 1
        duplicate_fields[sheet_name] = {k:v for k,v in duplicate_fields[sheet_name].items() if v > 1}
        normalized_headers = utils.parameterize_list(csv_headers[sheet_name])
        fields_not_in_redcap[sheet_name] = [header for header, normalized_header in zip(csv_headers[sheet_name], normalized_headers) if normalized_header not in all_field_names]

    all_csv_headers = list(set(all_csv_headers))

    unmatched_data_fields = {}

    for sheet in csv_headers:
        if not data_field_to_redcap_field_map.get(sheet):
            data_field_to_redcap_field_map[sheet] = {}
        if not unmatched_data_fields.get(sheet):
            unmatched_data_fields[sheet] = []
        for header in csv_headers[sheet]:
            normalized_header = utils.parameterize(header)
            if data_field_to_redcap_field_map[sheet].get(header):
                continue
            if normalized_header in all_field_names:
                data_field_to_redcap_field_map[sheet][header] = normalized_header
            else:
                unmatched_data_fields[sheet].append(header)

    selected_columns = {}

    # TODO Reconcile this with dataFieldToRedcapFieldMap
    matched_redcap_fields = []
    matched_redcap_fields += no_match_redcap_fields
    for sheet_name, field_map in data_field_to_redcap_field_map.items():
        selected_columns[sheet_name] = field_map.keys()
        matched_redcap_fields += field_map.values()
    unmatched_redcap_fields = [f for f in all_field_names if f not in matched_redcap_fields]
    for f1 in all_field_names:
        dd_field = [f for f in dd_data if f['field_name'] == f1][0]
        for sheet in csv_headers:
            for f2 in csv_headers[sheet]:
                if not redcap_field_candidates.get(f1):
                    redcap_field_candidates[f1] = []
                # existing_candidate = [item for item in redcap_field_candidates[f1] if item['candidate'] == f2]
                redcap_field_candidates[f1].append({
                    'candidate': f2,
                    'sheets': [sheet],
                    'score': max(fuzz.token_set_ratio(f1, f2), fuzz.token_set_ratio(dd_field['field_label'], f2))
                })

    for sheet in csv_headers:
        for f1 in csv_headers[sheet]:
            if data_field_candidates.get(f1):
                continue
            data_field_candidates[f1] = []
            for f2 in all_field_names:
                dd_field = [f for f in dd_data if f['field_name'] == f2][0]
                data_field_candidates[f1].append({
                    'candidate': f2,
                    'form_name': dd_field['form_name'],
                    'score': max(fuzz.token_set_ratio(f1, f2), fuzz.token_set_ratio(dd_field['field_label'], f1))
                })

    malformed_sheets = []
    all_errors       = []

    form_names = [redcap_field.form_name for redcap_field in dd]
    form_names = list(set(form_names))
    for sheet_name in records.keys():
        sheet = records.get(sheet_name)

        redcap_field_names = [f.field_name for f in dd]

        matching_fields = [f for f in sheet.columns if f in redcap_field_names]
        if not matching_fields and not data_field_to_redcap_field_map.get(sheet_name):
            malformed_sheets.append(sheet_name)

        redcap_fields_not_in_data = [f for f in redcap_field_names if f not in sheet.columns]

        sheet_fields_not_in_redcap = [f for f in sheet.columns if f not in redcap_field_names]

        if sheet_fields_not_in_redcap:
            all_errors.append("Fields in Instrument {0} not present in REDCap: {1}".format(sheet_name, str(sheet_fields_not_in_redcap)))
        if redcap_fields_not_in_data:
            all_errors.append("Fields in REDCap not present in Instrument {0}: {1}".format(sheet_name, str(redcap_fields_not_in_data)))

    json_data   = {}

    for sheet_name, sheet in records.items():
        try:
            json_data[sheet_name] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        except Exception as e:
            logging.warning(e)
            results = {
                'error': str(e)
            }
            response = flask.jsonify(results)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response

    results = {
        'csvHeaders':              csv_headers,
        'jsonData':                json_data,
        'ddHeaders':               dd_headers,
        'ddData':                  dd_data,
        'ddDataRaw':               dd_data_raw,
        'formNames':               form_names,
        'dateColumns':             date_cols,
        'duplicateFields':         duplicate_fields,
        'malformedSheets':         malformed_sheets,
        'recordFieldsNotInRedcap': fields_not_in_redcap,
        'formNameToDdFields':      form_name_to_dd_fields,
        'projectInfo':             project_info,
        'existingRecords':         existing_records,
        'recordidField':           recordid_field,
        'redcapFieldCandidates':   redcap_field_candidates,
        'dataFieldCandidates':     data_field_candidates,
        'unmatchedRedcapFields':   unmatched_redcap_fields,
        'unmatchedDataFields':     unmatched_data_fields,
        'dataFileName':            datafile_name,
        'token':                   token,
        'env':                     env,
    }
    if data_field_to_redcap_field_map:
        results['dataFieldToRedcapFieldMap'] = data_field_to_redcap_field_map
    if data_field_to_choice_map:
        results['dataFieldToChoiceMap'] = data_field_to_choice_map
    if original_to_correct_value_map:
        results['originalToCorrectedValueMap'] = original_to_correct_value_map
    if no_match_redcap_fields:
        results['noMatchRedcapFields'] = no_match_redcap_fields

    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

CORS(app, expose_headers='Authorization')
