import pandas as pd
import logging
import datetime
import os
import numbers
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from utils import utils
import logging
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
        validations = [d and d != '' for d in list_to_validate]
    else:
        validations = list_to_validate
    return validations


def lint_instrument(data_dictionary, form_name, records, repeatable, all_errors=[]):
    instrument_errors = pd.DataFrame().reindex_like(records)
    instrument_errors[:] = False

    records_missing_required_data = []

    total_error_count = 0

    repeat_instance_dict = {}  # Dict from recordid to repeat instance number, auto-increment from 1

    recordid_field = data_dictionary[0]
    # form_fields = [f for f in data_dictionary if f.form_name == form_name or f.field_name == recordid_field.field_name]
    form_fields = data_dictionary

    matching_fields = [f for f in form_fields if f.field_name in records.columns]
    matching_field_names = [f.field_name for f in matching_fields]
    output_records = records[matching_field_names].copy()
    if recordid_field.field_name not in records.columns:
        total_error_count += 1
        all_errors.append("Primary key {0} not present in instrument {1}.".format(recordid_field.field_name, form_name))
        output_records.insert(0, recordid_field.field_name, None)
        output_records[recordid_field.field_name] = list(range(1, len(output_records.index)+1))
    output_records.insert(1, 'redcap_repeat_instrument', None)
    output_records.insert(2, 'redcap_repeat_instance', None)

    if repeatable and recordid_field.field_name in records.columns:
        output_records['redcap_repeat_instrument'] = [form_name] * len(output_records.index)
        redcap_repeat_instance = []
        for recordid in list(records[recordid_field.field_name]):
            if recordid not in repeat_instance_dict:
                redcap_repeat_instance.append(1)
                repeat_instance_dict[recordid] = 1
            else:
                repeat_instance_dict[recordid] += 1
                redcap_repeat_instance.append(repeat_instance_dict[recordid])
        output_records['redcap_repeat_instance'] = redcap_repeat_instance

    for redcap_field in matching_fields:
        current_list = list(records[redcap_field.field_name])
        current_list = [i.strip() if isinstance(i, basestring) else i for i in current_list]

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
            for item in current_list:
                if not item:
                    # has_error = True if redcap_field.required else None
                    errors.append(None)
                else:
                    if is_encoded:
                        errors.append(False)
                    else:
                        errors.append(item not in choices_dict)
            instrument_errors[redcap_field.field_name] = errors

            if redcap_field.field_type == 'checkbox':
                for key, value in choices_dict.items():
                    checked_list = [1 if key == d else 0 for d in current_list]
                    output_records["{0}__{1}".format(redcap_field.field_name, value)] = checked_list
                output_records.drop(redcap_field.field_name, 1, inplace=True)
            else:
                current_list = [str(int(item)) if isinstance(item, numbers.Number) and float(item).is_integer() else str(item) for item in current_list]
                replaced_choices = [choices_dict.get(item) or item for item in current_list]
                output_records[redcap_field.field_name] = replaced_choices
        else:
            raise Exception('Unrecognized field_type: {0}'.format(redcap_field.field_type))

        total_error_count += len([d for d in instrument_errors[redcap_field.field_name] if d is True])

    instrument_errors = instrument_errors if total_error_count > 0 else None
    return {
        'encoded_records': output_records,
        'instrument_errors': instrument_errors,
        'records_missing_required_data': records_missing_required_data
    }


def lint_datafile(data_dictionary, records, project_info):
    recordid_field = data_dictionary[0]
    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))

    instruments_with_errors = []
    original_records = {}
    cells_with_errors = {}
    records_missing_required_data = {}

    all_errors = []

    for instrument in records.keys():
        sheet_name = utils.parameterize(instrument)
        instrument_records = records.get(instrument)
        original_records[instrument] = instrument_records.copy()
        instrument_errors = pd.DataFrame().reindex_like(instrument_records)
        instrument_errors.columns = utils.parameterize_list(list(instrument_errors.columns))
        instrument_errors[:] = False
        cells_with_errors[instrument] = instrument_errors

    normalized_instruments_dict = dict(zip(utils.parameterize_list(records.keys()), records.keys()))

    # for instrument in form_names:
    for instrument in records.keys():
        repeatable = instrument in utils.parameterize_list(project_info['repeatable_instruments'])
        # sheet_name = normalized_instruments_dict.get(instrument)
        instrument_records = records.get(instrument)
        if instrument_records is not None:
            results = lint_instrument(data_dictionary, instrument, instrument_records, repeatable, all_errors)
            instrument_records_missing_required_data = results['records_missing_required_data']
            if len(instrument_records_missing_required_data) > 0:
                records_missing_required_data[instrument] = instrument_records_missing_required_data
            errors = results['instrument_errors']
            if errors is not None:
                instruments_with_errors.append(instrument)
                cells_with_errors[instrument] = errors
        else:
            all_errors.append("Instrument {0} not found in datafile.".format(instrument))

    return {
        'cells_with_errors': cells_with_errors,
        'records_missing_required_data': records_missing_required_data,
        'linting_errors': all_errors
    }

def encode_datafile(data_dictionary, records, project_info):
    encoded_records = {}

    all_errors = []
    for instrument in records.keys():
        repeatable = instrument in utils.parameterize_list(project_info['repeatable_instruments'])
        instrument_records = records.get(instrument)
        if instrument_records is not None:
            results = lint_instrument(data_dictionary, instrument, instrument_records, repeatable, all_errors)
            output = results['encoded_records']
            encoded_records[instrument] = output

    return encoded_records
