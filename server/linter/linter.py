import pandas as pd
import logging
import datetime
import os
import numbers
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from utils import utils
import flask

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)

def validate_text_type(list_to_validate, redcap_field):
    text_validation = redcap_field.text_validation
    text_min = redcap_field.text_min
    text_max = redcap_field.text_max
    required = redcap_field.required
    if text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
        validations = utils.validate_dates(list_to_validate, text_validation, text_min, text_max, required)
    elif text_validation in ['number_2dp', 'integer']:
        validations = utils.validate_numbers(list_to_validate, text_validation, text_min, text_max, required)
    elif text_validation in ['alpha_only']:
        validations = [str(i).isalpha() if i else None for i in list_to_validate]
    elif required:
        validations = [d != '' for d in list_to_validate]
    else:
        validations = list_to_validate
    return validations


def lint_sheet(data_dictionary, project_info, sheet_name, records):
    instrument_errors = pd.DataFrame().reindex_like(records)
    instrument_errors[:] = False

    all_errors = []
    rows_in_error = []

    encoded_fields = {}

    total_error_count = 0

    recordid_field = None
    if project_info.get('record_autonumbering_enabled') == 1:
        recordid_field = RedcapField(field_name='recordid', field_type='text')
    else:
        recordid_field = data_dictionary[0]
    form_fields = data_dictionary

    # TODO Generate output records from this, add on for each additional form.
    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))
    grouped_data_dictionary = {}
    for form in form_names:
        grouped_data_dictionary[form] = [field for field in data_dictionary if field.form_name == form or field.field_name == recordid_field.field_name]

    matching_fields = {}
    matching_field_names = []
    for form_name in grouped_data_dictionary:
        form_fields = [f for f in grouped_data_dictionary[form_name] if f.field_name in records.columns]
        if len(form_fields) > 0:
            matching_fields[form_name] = form_fields
            matching_field_names += [f.field_name for f in matching_fields[form_name]]

    # TODO check if autonumbered
    if recordid_field.field_name != 'recordid' and recordid_field.field_name not in records.columns:
        total_error_count += 1
        all_errors.append("Primary key {0} not present in sheet {1}.".format(recordid_field.field_name, sheet_name))

    output_records = pd.DataFrame()
    output_records.insert(0, recordid_field.field_name, None)
    output_records.insert(1, 'redcap_repeat_instrument', None)
    output_records.insert(2, 'redcap_repeat_instance', None)

    # TODO get list of row ids to exclude in final output_records
    rows_to_remove = []

    repeated_recordids = []

    for form_name in matching_fields:
        repeat_instance_dict = {}  # Dict from recordid to repeat instance number, auto-increment from 1

        next_record_name = project_info['next_record_name']
        unique_record_ids = []
        if recordid_field.field_name in records.columns:
            redcap_repeat_instance = []
            for idx, recordid in enumerate(list(records[recordid_field.field_name])):
                if pd.isnull(recordid) or not recordid:
                    # rows_to_remove.append(idx)
                    rows_in_error.append(idx)
                    redcap_repeat_instance.append(None)
                elif recordid not in repeat_instance_dict:
                    unique_record_ids.append(recordid)
                    redcap_repeat_instance.append(1)
                    repeat_instance_dict[recordid] = 1
                else:
                    repeat_instance_dict[recordid] += 1
                    redcap_repeat_instance.append(repeat_instance_dict[recordid])

            for recordid in repeat_instance_dict:
                if repeat_instance_dict[recordid] > 1:
                    repeated_recordids.append(recordid)

    for form_name in matching_fields:
        encoded_fields[form_name] = []
        for redcap_field in matching_fields[form_name]:
            current_list = list(records[redcap_field.field_name])
            current_list = [i.strip() if isinstance(i, str) else i for i in current_list]

            for idx, item in enumerate(current_list):
                if (pd.isnull(item) or not item) and redcap_field.required:
                    if idx not in rows_in_error:
                        rows_in_error.append(idx)
                    all_errors.append("Required field missing for {0} at index {1}.".format(redcap_field.field_name, idx))

            if redcap_field.field_type in ['text', 'notes']:
                validations = validate_text_type(current_list, redcap_field)
                formatted_values = current_list
                if redcap_field.text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
                    formatted_values = utils.format_dates(current_list, redcap_field.text_validation)
                records[redcap_field.field_name] = formatted_values
                instrument_errors[redcap_field.field_name] = [d is False for d in validations]
                for idx, valid in enumerate(validations):
                    if valid is False and idx not in rows_in_error:
                        rows_in_error.append(idx)
            elif redcap_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
                choices_dict = redcap_field.choices_dict

                # Always do this or just for yesno/truefalse?
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]

                current_list = [str(item) for item in current_list]
                is_encoded = all([item in choices_dict.values() or item == '' for item in current_list])
                if is_encoded:
                    encoded_fields[form_name].append(redcap_field.field_name)
                for idx, item in enumerate(current_list):
                    if item and item not in choices_dict and not is_encoded:
                        if idx not in rows_in_error:
                            rows_in_error.append(idx)
                        all_errors.append("{0} not found in Permissible Values: {1}".format(item, str(choices_dict)))
                errors = []
                for idx, item in enumerate(current_list):
                    if not item:
                        has_error = None
                        if redcap_field.required:
                            has_error = True
                        errors.append(has_error)
                    else:
                        if is_encoded:
                            errors.append(False)
                        else:
                            errors.append(item not in choices_dict)
                instrument_errors[redcap_field.field_name] = errors

                if redcap_field.field_type == 'checkbox':
                    for key, value in choices_dict.items():
                        checked_list = [1 if key == d else 0 for d in current_list]
                else:
                    current_list = [str(int(item)) if isinstance(item, numbers.Number) and float(item).is_integer() else str(item) for item in current_list]
                    replaced_choices = [choices_dict.get(item) or None for item in current_list]
            elif redcap_field.field_type in ['checkbox']:
                current_list = [str(item) for item in current_list]
                errors = []
                for idx, item in enumerate(current_list):
                    if not item:
                        has_error = None
                        if redcap_field.required:
                            has_error = True
                        errors.append(has_error)
                    else:
                        permissible_values = [str(i).lower() for i in redcap_field.choices_dict.keys()]
                        checkbox_items = [i.strip() for i in item.split(',')]
                        has_error = False
                        for i in checkbox_items:
                            if str(i).lower() not in permissible_values:
                                all_errors.append("{0} not found in Permissible Values: {1}".format(i, permissible_values))
                                has_error = True
                        if has_error:
                            rows_in_error.append(idx)
                        errors.append(has_error)
                instrument_errors[redcap_field.field_name] = errors
            else:
                raise Exception('Unrecognized field_type: {0}'.format(redcap_field.field_type))

            total_error_count += len([d for d in instrument_errors[redcap_field.field_name] if d is True])

    instrument_errors = instrument_errors if total_error_count > 0 else None

    # TODO Make repeatable rows separate
    repeat_instance_dict = {}
    if recordid_field.field_name in list(records.columns):
        for index, row in records.iterrows():
            encoded_row = {}
            if int(index) in rows_in_error:
                continue
            if not repeat_instance_dict.get(row[recordid_field.field_name]):
                repeat_instance_dict[row[recordid_field.field_name]] = 1
            else:
                repeat_instance_dict[row[recordid_field.field_name]] += 1
            for form_name in matching_fields:
                encoded_repeatable_row = {}
                row_to_encode = encoded_row
                if form_name in project_info.get('repeatable_instruments'):
                    row_to_encode = encoded_repeatable_row
                for matching_field in matching_fields[form_name]:
                    if matching_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
                        if encoded_fields[form_name] and matching_field.field_name in encoded_fields[form_name]:
                            row_to_encode[matching_field.field_name] = row[matching_field.field_name]
                        else:
                            row_to_encode[matching_field.field_name] = matching_field.choices_dict.get(row[matching_field.field_name])
                    elif matching_field.field_type in ['checkbox']:
                        permissible_values = [str(i).lower() for i in matching_field.choices_dict.keys()]
                        checkbox_items = [i.strip() for i in row[matching_field.field_name].split(',')]
                        for permissible_value in permissible_values:
                            if permissible_value in checkbox_items:
                                encoded_row['{0}__{1}'.format(matching_field.field_name, permissible_value)] = 1
                            else:
                                encoded_row['{0}__{1}'.format(matching_field.field_name, permissible_value)] = 0
                    else:
                        row_to_encode[matching_field.field_name] = row[matching_field.field_name]
                if form_name in project_info.get('repeatable_instruments'):
                    row_to_encode['redcap_repeat_instrument'] = form_name
                    row_to_encode['redcap_repeat_instance'] = repeat_instance_dict.get(row[recordid_field.field_name])
                    output_records = output_records.append(row_to_encode, ignore_index=True)
            output_records = output_records.append(encoded_row, ignore_index=True)

    if project_info.get('record_autonumbering_enabled') == 1:
        record_inst = project_info.get('next_record_name')
        for index, row in records.iterrows():
            encoded_row = {'recordid': record_inst}
            if int(index) in rows_in_error:
                continue
            for form_name in matching_fields:
                # Cannot do repeatable instruments if autonumbered for now
                if form_name in project_info.get('repeatable_instruments'):
                    continue
                for matching_field in matching_fields[form_name]:
                    if matching_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
                        if encoded_fields[form_name] and matching_field.field_name in encoded_fields[form_name]:
                            encoded_row[matching_field.field_name] = row[matching_field.field_name]
                        else:
                            encoded_row[matching_field.field_name] = matching_field.choices_dict.get(row[matching_field.field_name])
                    elif matching_field.field_type in ['checkbox']:
                        permissible_values = [str(i).lower() for i in matching_field.choices_dict.keys()]
                        checkbox_items = [i.strip() for i in row[matching_field.field_name].split(',')]
                        for permissible_value in permissible_values:
                            if permissible_value in checkbox_items:
                                encoded_row['{0}__{1}'.format(matching_field.field_name, permissible_value)] = 1
                            else:
                                encoded_row['{0}__{1}'.format(matching_field.field_name, permissible_value)] = 0
                    else:
                        encoded_row[matching_field.field_name] = row[matching_field.field_name]
            output_records = output_records.append(encoded_row, ignore_index=True)
            record_inst += 1


    # rows_to_remove = list(set(rows_to_remove))

    # Drop rows with missing required data
    # output_records.drop(output_records.index[rows_in_error], inplace=True)

    rows_in_error = list(set(rows_in_error))
    rows_in_error.sort()
    # logging.warning(rows_in_error)

    return {
        'encoded_records': output_records,
        'instrument_errors': instrument_errors,
        'rows_in_error': rows_in_error,
        'all_errors': all_errors,
    }


def lint_datafile(data_dictionary, records, project_info):
    recordid_field = data_dictionary[0]
    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))

    original_records = {}
    cells_with_errors = {}
    rows_in_error = {}
    encoded_records = {}

    all_errors = []

    # TODO append to used_form_names if sheet in the Datafile is detected to have fields from that form.
    used_form_names = []

    for sheet_name in records.keys():
        instrument_records = records.get(sheet_name)
        original_records[sheet_name] = instrument_records.copy()
        instrument_errors = pd.DataFrame().reindex_like(instrument_records)
        instrument_errors[:] = False
        cells_with_errors[sheet_name] = instrument_errors

    for sheet_name in records.keys():
        sheet = records.get(sheet_name)
        if sheet is not None:
            results = lint_sheet(data_dictionary, project_info, sheet_name, sheet)
            all_errors += results['all_errors']
            encoded_records[sheet_name] = results['encoded_records']

            if len(results['rows_in_error']) > 0:
                rows_in_error[sheet_name] = results['rows_in_error']
            errors = results['instrument_errors']
            if errors is not None:
                cells_with_errors[sheet_name] = errors

    return {
        'encoded_records': encoded_records,
        'cells_with_errors': cells_with_errors,
        'rows_in_error': rows_in_error,
        'linting_errors': all_errors
    }

def encode_datafile(data_dictionary, records, project_info):
    encoded_records = {}

    for sheet_name, sheet in records.items():
        if sheet is not None:
            results = lint_sheet(data_dictionary, project_info, sheet_name, sheet)
            encoded_records[sheet_name] = results['encoded_records']

    return encoded_records
