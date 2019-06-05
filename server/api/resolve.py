import flask
from flask import request, Blueprint
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

resolve = Blueprint('resolve', __name__)

@resolve.route('/resolve_column', methods=['GET', 'POST', 'OPTIONS'])
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

    for sheet_name, sheet in records.items():
        json_data[sheet_name] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheet_name] = json.loads(cells_with_errors[sheet_name].to_json(orient='records'))

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

@resolve.route('/resolve_row', methods=['GET', 'POST', 'OPTIONS'])
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


@resolve.route('/resolve_merge_row', methods=['GET', 'POST', 'OPTIONS'])
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

@resolve.route('/calculate_merge_conflicts', methods=['GET', 'POST', 'OPTIONS'])
def calculate_merge_conflicts():
    recordid_field = json.loads(form.get('recordidField'))
    existing_records = json.loads(form.get('existingRecords'))
    reconciliation_columns = json.loads(form.get('reconciliationColumns'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    records_to_reconcile = {}
    if existing_records:
        for record in existing_records:
            if not record['redcap_repeat_instrument']:
                # TODO implement merging logic
                records_to_reconcile[record[recordid_field]] = record

    records = {}
    for sheet in json_data:
        records[sheet] = pd.DataFrame(json_data[sheet])

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
        'mergeConflicts': [],
    }
    response = flask.jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response