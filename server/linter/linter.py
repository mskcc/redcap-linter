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
    records_missing_required_data = []

    total_error_count = 0

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

    output_records = pd.DataFrame()

    if recordid_field.field_name != 'recordid' and recordid_field.field_name not in records.columns:
        total_error_count += 1
        all_errors.append("Primary key {0} not present in sheet {1}.".format(recordid_field.field_name, sheet_name))
    output_records.insert(0, recordid_field.field_name, None)
    if len(project_info['repeatable_instruments']) > 0:
        output_records.insert(1, 'redcap_repeat_instrument', None)
        output_records.insert(2, 'redcap_repeat_instance', None)

    # TODO get list of row ids to exclude in final output_records
    rows_to_remove = []

    repeated_recordids = []

    for form_name in matching_fields:
        repeat_instance_dict = {}  # Dict from recordid to repeat instance number, auto-increment from 1

        next_record_name = project_info['next_record_name']
        repeatable = form_name in utils.parameterize_list(project_info['repeatable_instruments'])
        unique_record_ids = []
        if recordid_field.field_name in records.columns:
            redcap_repeat_instance = []
            for row_num, recordid in enumerate(list(records[recordid_field.field_name])):
                if pd.isnull(recordid) or not recordid:
                    # rows_to_remove.append(row_num)
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

            if repeatable:
                output_records[recordid_field.field_name] = pd.Series(list(records[recordid_field.field_name]))
                output_records['redcap_repeat_instrument'] = pd.Series([form_name] * len(list(records[recordid_field.field_name])))
                output_records['redcap_repeat_instance'] = pd.Series(redcap_repeat_instance)
            else:
                # TODO Figure out how to handle merging logic
                # if not unique_record_ids:
                recordid_list = list(range(next_record_name, next_record_name + len(records.index)+1))
                output_records[recordid_field.field_name] = pd.Series(recordid_list)
                    # output_records['redcap_repeat_instrument'] = pd.Series([None] * len(unique_record_ids))
                    # output_records['redcap_repeat_instance'] = pd.Series([None] * len(unique_record_ids))
                # else:
                    # TODO Only do this for non repeatable instruments
                    # output_records[recordid_field.field_name] = pd.Series(unique_record_ids)
                    # output_records['redcap_repeat_instrument'] = pd.Series([None] * len(recordid_list))
                    # output_records['redcap_repeat_instance'] = pd.Series([None] * len(recordid_list))
        else:
            output_records[recordid_field.field_name] = pd.Series(list(range(next_record_name, next_record_name + len(records.index)+1)))

    for form_name in matching_fields:
        repeatable = form_name in utils.parameterize_list(project_info['repeatable_instruments'])
        for redcap_field in matching_fields[form_name]:
            current_list = list(records[redcap_field.field_name])
            current_list = [i.strip() if isinstance(i, basestring) else i for i in current_list]

            if redcap_field.field_name != recordid_field.field_name:
                for idx, item in enumerate(current_list):
                    if (pd.isnull(item) or not item) and redcap_field.required:
                        if (idx not in records_missing_required_data):
                            records_missing_required_data.append(idx)
                        all_errors.append("Required field missing for {0} at index {1}.".format(redcap_field.field_name, idx))

            if redcap_field.field_type in ['text', 'notes']:
                validations = validate_text_type(current_list, redcap_field)
                formatted_values = current_list
                if redcap_field.text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
                    formatted_values = utils.format_dates(current_list, redcap_field.text_validation)
                records[redcap_field.field_name] = formatted_values
                instrument_errors[redcap_field.field_name] = [d is False for d in validations]
                if redcap_field.field_name != recordid_field.field_name:
                    output_records[redcap_field.field_name] = pd.Series([f if v else None for f, v in zip(formatted_values, validations)])
                    # if redcap_field.required:
                    #     rows_to_remove += [row_num for row_num, val in enumerate(current_list) if not val]
            elif redcap_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox']:
                choices_dict = redcap_field.choices_dict

                # Always do this or just for yesno/truefalse?
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]

                current_list = [str(item) for item in current_list]
                is_encoded = all([item in choices_dict.values() for item in current_list])
                for idx, item in enumerate(current_list):
                    if item and not is_encoded and item not in choices_dict:
                        all_errors.append("{0} not found in Permissible Values: {1}".format(item, str(choices_dict)))
                errors = []
                for row_num, item in enumerate(current_list):
                    if not item:
                        has_error = None
                        if redcap_field.required:
                            has_error = True
                            # rows_to_remove.append(row_num)
                        errors.append(has_error)
                    else:
                        if is_encoded:
                            errors.append(False)
                        else:
                            if redcap_field.field_type == 'checkbox':
                                permissible_values = map(str.lower, map(str, redcap_field.choices_dict.keys()))
                                checkbox_items = [i.strip() for i in item.split(',')]
                                errors.append(True in [str(i).lower() not in permissible_values for i in checkbox_items])
                            else:
                                errors.append(item not in choices_dict)
                instrument_errors[redcap_field.field_name] = errors

                if redcap_field.field_type == 'checkbox':
                    for key, value in choices_dict.items():
                        checked_list = [1 if key == d else 0 for d in current_list]
                        output_records["{0}__{1}".format(redcap_field.field_name, value)] = pd.Series(checked_list)
                    # output_records.drop(redcap_field.field_name, 1, inplace=True)
                else:
                    current_list = [str(int(item)) if isinstance(item, numbers.Number) and float(item).is_integer() else str(item) for item in current_list]
                    replaced_choices = [choices_dict.get(item) or None for item in current_list]
                    output_records[redcap_field.field_name] = pd.Series(replaced_choices)
            else:
                raise Exception('Unrecognized field_type: {0}'.format(redcap_field.field_type))

            total_error_count += len([d for d in instrument_errors[redcap_field.field_name] if d is True])

    instrument_errors = instrument_errors if total_error_count > 0 else None

    # rows_to_remove = list(set(rows_to_remove))

    # Drop rows with missing required data
    output_records.drop(output_records.index[records_missing_required_data], inplace=True)

    return {
        'encoded_records': output_records,
        'instrument_errors': instrument_errors,
        'repeated_recordids': repeated_recordids,
        'records_missing_required_data': records_missing_required_data,
        'all_errors': all_errors,
    }


def lint_datafile(data_dictionary, records, project_info):
    recordid_field = data_dictionary[0]
    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))

    original_records = {}
    cells_with_errors = {}
    records_missing_required_data = {}
    repeated_recordids = {}
    encoded_records = {}

    all_errors = []

    # TODO append to used_form_names if sheet in the Datafile is detected to have fields from that form.
    used_form_names = []

    for sheet_name in records.keys():
        instrument_records = records.get(sheet_name)
        original_records[sheet_name] = instrument_records.copy()
        instrument_errors = pd.DataFrame().reindex_like(instrument_records)
        instrument_errors.columns = utils.parameterize_list(list(instrument_errors.columns))
        instrument_errors[:] = False
        cells_with_errors[sheet_name] = instrument_errors

    for sheet_name in records.keys():
        sheet = records.get(sheet_name)
        if sheet is not None:
            results = lint_sheet(data_dictionary, project_info, sheet_name, sheet)
            all_errors += results['all_errors']
            encoded_records[sheet_name] = results['encoded_records']

            if len(results['records_missing_required_data']) > 0:
                records_missing_required_data[sheet_name] = results['records_missing_required_data']
            if len(results['repeated_recordids']) > 0:
                repeated_recordids[sheet_name] = results['repeated_recordids']
            errors = results['instrument_errors']
            if errors is not None:
                cells_with_errors[sheet_name] = errors

    return {
        'encoded_records': encoded_records,
        'cells_with_errors': cells_with_errors,
        'records_missing_required_data': records_missing_required_data,
        'repeated_recordids': repeated_recordids,
        'linting_errors': all_errors
    }

def encode_datafile(data_dictionary, records, project_info):
    encoded_records = {}

    for sheet_name in records.keys():
        sheet = records.get(sheet_name)
        if sheet is not None:
            results = lint_sheet(data_dictionary, project_info, sheet_name, sheet)
            encoded_records[sheet_name] = results['encoded_records']

    return encoded_records
