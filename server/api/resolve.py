import json
import numbers
import logging
from collections import OrderedDict
import flask
from flask import request, Blueprint
import pandas as pd
from fuzzywuzzy import fuzz
from models.redcap_field import RedcapField
from linter import linter
from serializers import serializer
from utils import utils

RESOLVE = Blueprint('resolve', __name__)

# TODO Return nextSheetName and nextColumn/nextRow to the frontend to display
@RESOLVE.route('/resolve_column', methods=['GET', 'POST', 'OPTIONS'])
def resolve_column():
    form = request.form.to_dict()
    csv_headers = json.loads(form.get('csvHeaders'))
    action = json.loads(form.get('action', '""'))
    next_column = json.loads(form.get('nextColumn', '""'))
    next_sheet_name = json.loads(form.get('nextSheetName', '""'))
    working_column = json.loads(form.get('workingColumn', '""'))
    working_sheet_name = json.loads(form.get('workingSheetName', '""'))
    data_field_to_choice_map = json.loads(form.get('dataFieldToChoiceMap', '{}'))
    original_to_correct_value_map = json.loads(form.get('originalToCorrectedValueMap', '{}'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    transform_map = {}
    has_transforms = False

    for sheet in json_data:
        transform_map[sheet] = {
            **data_field_to_choice_map.get(working_sheet_name, {}).get(working_column, {}),
            **original_to_correct_value_map.get(working_sheet_name, {}).get(working_column, {})
        }
        if transform_map[sheet]:
            has_transforms = True

    data_dictionary = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    records = {}
    for sheet in json_data:
        frame = pd.DataFrame(json_data[sheet])
        frame = frame[csv_headers[sheet]]
        frame.fillna('', inplace=True)
        if sheet == working_sheet_name:
            new_list = []
            for field in list(frame[working_column]):
                new_value = transform_map[sheet].get(str(field)) or field
                if isinstance(new_value, list):
                    new_value = ', '.join([str(i) for i in new_value])
                new_list.append(new_value)
            frame[working_column] = new_list
        records[sheet] = frame

    project_info = json.loads(form.get('projectInfo', '{}'))

    field_errors = {}
    if next_column:
        field_errors = calculate_field_errors(next_column, next_sheet_name, data_dictionary, records)

    row_info = {}
    json_data = {}
    next_row = -1

    for sheet_name, sheet in records.items():
        json_data[sheet_name] = json.loads(sheet.to_json(orient='records', date_format='iso'))

    results = {
        'jsonData': json_data,
    }

    if has_transforms:
        datafile_errors = linter.lint_datafile(data_dictionary, project_info, records)
        cells_with_errors = datafile_errors['cells_with_errors']
        rows_in_error = utils.get_rows_with_errors(cells_with_errors, records)
        columns_in_error = utils.get_columns_with_errors(cells_with_errors, records)

        for sheet_name, sheet in records.items():
            cells_with_errors[sheet_name] = json.loads(cells_with_errors[sheet_name].to_json(orient='records'))

        #TODO Check if next_row and next_row is still in error
        if not next_column and rows_in_error:
            next_sheet_name = list(rows_in_error.keys())[0]
            next_row = rows_in_error[next_sheet_name][0]
            row_info = calculate_row_info(next_row, next_sheet_name, data_dictionary, records)

        all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]
        results['allErrors'] = all_errors
        results['columnsInError'] = columns_in_error
        results['cellsWithErrors'] = cells_with_errors
        results['rowsInError'] = rows_in_error

    if action == 'continue':
        results['workingColumn'] = next_column
        results['workingSheetName'] = next_sheet_name
        results['fieldErrors'] = field_errors
        results['rowInfo'] = row_info
        results['workingRow'] = next_row

    return flask.jsonify(results)

@RESOLVE.route('/resolve_row', methods=['GET', 'POST', 'OPTIONS'])
def resolve_row():
    form = request.form.to_dict()
    csv_headers = json.loads(form.get('csvHeaders'))
    action = json.loads(form.get('action', '""'))
    next_row = json.loads(form.get('nextRow', '-1'))
    next_sheet_name = json.loads(form.get('nextSheetName', '""'))
    working_row = json.loads(form.get('workingRow', '-1'))
    working_sheet_name = json.loads(form.get('workingSheetName', '""'))
    field_to_value_map = json.loads(form.get('fieldToValueMap'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    data_dictionary = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    value_map = field_to_value_map.get(working_sheet_name, {}).get(str(working_row), {})

    records = {}
    for sheet in json_data:
        frame = pd.DataFrame(json_data[sheet])
        frame = frame[csv_headers[sheet]]
        frame.fillna('', inplace=True)
        if sheet == working_sheet_name:
            for field in value_map:
                dd_field = [f for f in data_dictionary if f.field_name == field][0]
                value = value_map[field]
                if dd_field.text_validation == 'integer':
                    value = int(value) if value else value
                elif dd_field.text_validation == 'number_2dp':
                    value = float(value) if value else value
                frame.iloc[working_row, frame.columns.get_loc(field)] = value
        records[sheet] = frame

    project_info = json.loads(form.get('projectInfo'))


    datafile_errors = linter.lint_datafile(data_dictionary, project_info, records)
    cells_with_errors = datafile_errors['cells_with_errors']
    # TODO Figure out why errors on malformed sheets get added here
    rows_in_error = utils.get_rows_with_errors(cells_with_errors, records)
    columns_in_error = utils.get_columns_with_errors(cells_with_errors, records)

    #TODO Check if next_column and next_column is still in error
    row_info = {}
    field_errors = {}
    next_column = ''
    if next_row >= 0:
        row_info = calculate_row_info(next_row, next_sheet_name, data_dictionary, records)
    elif columns_in_error:
        # Get next column
        next_sheet_name = list(columns_in_error.keys())[0]
        next_column = columns_in_error[next_sheet_name][0]
        field_errors = calculate_field_errors(next_column, next_sheet_name, data_dictionary, records)

    all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]

    json_data = {}

    for sheet_name, sheet in records.items():
        json_data[sheet_name] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheet_name] = json.loads(cells_with_errors[sheet_name].to_json(orient='records'))

    results = {
        'jsonData':         json_data,
        'allErrors':        all_errors,
        'rowsInError':      rows_in_error,
        'columnsInError':   columns_in_error,
        'rowInfo':          row_info,
        'cellsWithErrors':  cells_with_errors,
    }
    if action == 'continue':
        results['workingRow'] = next_row
        results['workingSheetName'] = next_sheet_name
        results['workingColumn'] = next_column
        results['fieldErrors'] = field_errors
    return flask.jsonify(results)


@RESOLVE.route('/resolve_merge_row', methods=['GET', 'POST', 'OPTIONS'])
def resolve_merge_row():
    form = request.form.to_dict()
    csv_headers = json.loads(form.get('csvHeaders'))
    # Working column is the column being saved
    action = json.loads(form.get('action', '""'))
    next_merge_row = json.loads(form.get('nextMergeRow', '-1'))
    next_sheet_name = json.loads(form.get('nextSheetName', '""'))
    working_merge_row = json.loads(form.get('workingMergeRow', '-1'))
    working_sheet_name = json.loads(form.get('workingSheetName', '""'))
    merge_map = json.loads(form.get('mergeMap', '{}'))
    merge_conflicts = json.loads(form.get('mergeConflicts', '{}'))
    project_info = json.loads(form.get('projectInfo', '{}'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    data_dictionary = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    row_merge_map = merge_map.get(working_sheet_name, {}).get(str(working_merge_row), {})

    records = {}
    for sheet in json_data:
        frame = pd.DataFrame(json_data[sheet])
        frame = frame[csv_headers[sheet]]
        frame.fillna('', inplace=True)
        if sheet == working_sheet_name:
            for field in row_merge_map:
                dd_field = [f for f in data_dictionary if f.field_name == field][0]
                value = row_merge_map[field]
                if dd_field.text_validation == 'integer':
                    value = int(value) if value else value
                elif dd_field.text_validation == 'number_2dp':
                    value = float(value) if value else value
                frame.iloc[working_merge_row, frame.columns.get_loc(field)] = value
        records[sheet] = frame

    if working_sheet_name and merge_conflicts and merge_conflicts[working_sheet_name]:
        del merge_conflicts[working_sheet_name][str(working_merge_row)]

    datafile_errors = linter.lint_datafile(data_dictionary, project_info, records)
    cells_with_errors = datafile_errors['cells_with_errors']

    all_errors = [{"Error": error} for error in datafile_errors['linting_errors']]

    json_data = {}

    for sheet_name, sheet in records.items():
        json_data[sheet_name] = json.loads(sheet.to_json(orient='records', date_format='iso'))
        cells_with_errors[sheet_name] = json.loads(cells_with_errors[sheet_name].to_json(orient='records'))

    results = {
        'jsonData':         json_data,
        'allErrors':        all_errors,
        'mergeMap':         merge_map,
        'mergeConflicts':   merge_conflicts,
        'cellsWithErrors':  cells_with_errors,
    }
    if action == 'continue':
        results['workingMergeRow'] = next_merge_row
        results['workingSheetName'] = next_sheet_name
    return flask.jsonify(results)

@RESOLVE.route('/calculate_merge_conflicts', methods=['GET', 'POST', 'OPTIONS'])
def calculate_merge_conflicts():
    form = request.form.to_dict()
    recordid_field = json.loads(form.get('recordidField'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)
    dd_data = json.loads(form.get('ddData', '[]'))
    csv_headers = json.loads(form.get('csvHeaders', '{}'))
    existing_records = json.loads(form.get('existingRecords', '[]'))
    decoded_records = json.loads(form.get('decodedRecords', '{}'))
    project_info = json.loads(form.get('projectInfo', '{}'))
    malformed_sheets = json.loads(form.get('malformedSheets', '[]'))
    reconciliation_columns = json.loads(form.get('reconciliationColumns', '{}'))

    next_sheet_name = None
    next_merge_row = -1
    merge_conflicts = {}
    matching_repeat_instances = {}
    matching_record_ids = {}
    records = {}
    for sheet in json_data:
        frame = pd.DataFrame(json_data[sheet])
        frame.fillna('', inplace=True)
        frame = frame[csv_headers[sheet]]
        records[sheet] = frame

    for sheet_name, sheet in records.items():
        if sheet_name in malformed_sheets:
            continue

        if not merge_conflicts.get(sheet_name):
            merge_conflicts[sheet_name] = {}
        if not matching_repeat_instances.get(sheet_name):
            matching_repeat_instances[sheet_name] = {}
        if not matching_record_ids.get(sheet_name):
            matching_record_ids[sheet_name] = {}
        for index, record in sheet.iterrows():
            recordid = record.get(recordid_field)
            # TODO This only gets triggered if the recordid field in the datafile is not there.
            # We may want to look for merge conflicts by recordid AND seconday unique field
            if not recordid:
                # If recordid doesn't exist try to match on the secondary unique field
                existing_record = None
                for r in existing_records:
                    if r['redcap_repeat_instance']:
                        continue
                    matching = True
                    for field in project_info.get('secondary_unique_field', []):
                        if str(r[field]) != str(record.get(field)):
                            matching = False
                    if matching:
                        existing_record = r
                if not existing_record:
                    continue
                recordid = existing_record.get(recordid_field)
                matching_record_ids[sheet_name][index] = recordid
            if isinstance(recordid, float) and recordid.is_integer():
                # Excel reads this in as a float :/
                recordid = str(int(record[recordid_field]))
            recordid = str(recordid)
            record_to_merge = {}
            if not decoded_records.get(recordid):
                continue
            flat_record = [r for r in decoded_records.get(recordid) if not r['redcap_repeat_instance']]
            if flat_record:
                record_to_merge = flat_record[0].copy()
            for instrument in project_info['repeatable_instruments']:
                instrument_fields = [d for d in dd_data if d['form_name'] == instrument]
                primary_key = reconciliation_columns.get(instrument, [])
                matching_record = None
                for r in decoded_records.get(recordid):
                    if r['redcap_repeat_instrument'] != instrument:
                        continue
                    is_matching = all([record.get(key) == r.get(key) for key in primary_key])
                    if is_matching:
                        matching_record = r
                if matching_record:
                    for field in instrument_fields:
                        record_to_merge[field['field_name']] = matching_record[field['field_name']]
                    if not matching_repeat_instances[sheet_name].get(index):
                        matching_repeat_instances[sheet_name][index] = {}
                    matching_repeat_instances[sheet_name][index][instrument] = matching_record['redcap_repeat_instance']
            exact_match = True
            for dd_field in dd_data:
                if record_to_merge.get(dd_field['field_name']) and str(record.get(dd_field['field_name'])) != str(record_to_merge.get(dd_field['field_name'])):
                    # logging.warning(record.get(recordid_field))
                    # logging.warning(dd_field['field_name'])
                    # logging.warning("Datafile: " + str(record.get(dd_field['field_name'])))
                    # logging.warning("Existing: " + str(record_to_merge.get(dd_field['field_name'])))
                    exact_match = False
            if not exact_match:
                merge_conflicts[sheet_name][index] = record_to_merge
                if next_sheet_name is None:
                    next_sheet_name = sheet_name
                    next_merge_row = index

    results = {
        'mergeConflicts': merge_conflicts,
        'workingSheetName': next_sheet_name,
        'workingMergeRow': next_merge_row,
        'matchingRepeatInstances': matching_repeat_instances,
        'matchingRecordIds': matching_record_ids,
    }
    return flask.jsonify(results)

@RESOLVE.route('/encode_records', methods=['GET', 'POST', 'OPTIONS'])
def encode_records():
    form = request.form.to_dict()
    csv_headers = json.loads(form.get('csvHeaders'))
    malformed_sheets = json.loads(form.get('malformedSheets', '[]'))
    decoded_records = json.loads(form.get('decodedRecords'))
    matching_repeat_instances = json.loads(form.get('matchingRepeatInstances'))
    matching_record_ids = json.loads(form.get('matchingRecordIds'))
    project_info = json.loads(form.get('projectInfo'))
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    data_dictionary = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]

    records = {}
    for sheet in json_data:
        frame = pd.DataFrame(json_data[sheet])
        frame = frame[csv_headers[sheet]]
        frame.fillna('', inplace=True)
        records[sheet] = frame

    datafile_errors = linter.lint_datafile(data_dictionary, project_info, records)
    cells_with_errors = datafile_errors['cells_with_errors']
    rows_in_error = utils.get_rows_with_errors(cells_with_errors, records)

    options = {
        'rows_in_error': rows_in_error,
        'decoded_records': decoded_records,
        'matching_repeat_instances': matching_repeat_instances,
        'matching_record_ids': matching_record_ids
    }
    encoded_records = serializer.encode_datafile(data_dictionary, project_info, records, options)

    json_data = {}
    output_records = {}
    encoded_record_headers = {}

    for sheet_name in encoded_records:
        if malformed_sheets and sheet_name in malformed_sheets:
            continue
        output_records[sheet_name] = json.loads(encoded_records[sheet_name].to_json(orient='records'))
        encoded_record_headers[sheet_name] = list(encoded_records[sheet_name].columns)

    results = {
        'encodedRecords': output_records,
        'encodedRecordHeaders': encoded_record_headers,
    }
    return flask.jsonify(results)

# TODO Change the name of this and simplify, this is confusing
def calculate_field_errors(column, sheet_name, data_dictionary, records):
    field_errors = {}
    dd_field = [f for f in data_dictionary if f.field_name == column][0]
    field_errors['fieldType'] = dd_field.field_type
    field_errors['required'] = dd_field.required
    if dd_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox']:
        current_list = list(records[sheet_name][column])
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
        for unmatched_choice in field_errors['unmatchedChoices']:
            for dd_choice in dd_field.choices_dict:
                if not choice_candidates.get(unmatched_choice):
                    choice_candidates[unmatched_choice] = []
                choice_candidates[unmatched_choice].append({
                    'candidate': dd_choice,
                    'choiceValue': dd_field.choices_dict[dd_choice],
                    'score': fuzz.ratio(unmatched_choice, dd_choice)
                })
        field_errors['choiceCandidates'] = choice_candidates
    if dd_field.field_type in ['text', 'notes']:
        current_list = list(records[sheet_name][column])
        validations = utils.validate_text_type(current_list, dd_field)
        text_errors = [val for val, valid in zip(current_list, validations) if val and valid is False]
        field_errors['textErrors'] = text_errors
        field_errors['textValidation'] = dd_field.text_validation
        field_errors['textValidationMin'] = dd_field.text_min
        field_errors['textValidationMax'] = dd_field.text_max
    return field_errors

def calculate_row_info(idx, sheet_name, data_dictionary, records):
    row_info = {}
    row = records[sheet_name].iloc[int(idx)]
    choice_candidates = []
    for column in records[sheet_name].columns:
        dd_field = [f for f in data_dictionary if f.field_name == column]
        if not dd_field:
            continue
        dd_field = dd_field[0]
        if dd_field.field_type in ['dropdown', 'radio']:
            unmatched_choice = str(row[column])
            if not unmatched_choice:
                continue
            for dd_choice in dd_field.choices_dict:
                choice_candidates.append({
                    'candidate': dd_choice,
                    'choiceValue': dd_field.choices_dict[dd_choice],
                    'score': fuzz.ratio(unmatched_choice, dd_choice)
                })
            row_info[column] = choice_candidates
    return row_info
