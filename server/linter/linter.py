import pandas as pd
import logging
import datetime
import os
import numbers
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from utils import utils

def validate_text_type(list_to_validate, redcap_field):
    text_validation = redcap_field.text_validation
    text_min = redcap_field.text_min
    text_max = redcap_field.text_max
    required = redcap_field.required
    if text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
        validations = utils.validate_dates(list_to_validate, text_validation, text_min, text_max, required)
    elif text_validation in ['number_2dp', 'integer']:
        validations = utils.validate_numbers(list_to_validate, text_validation, text_min, text_max, required)
    elif required:
        validations = [d and d != '' for d in list_to_validate]
    else:
        validations = list_to_validate
    return validations


def lint_instrument(data_dictionary, form_name, records, repeatable, all_errors):
    instrument_errors = pd.DataFrame().reindex_like(records)
    instrument_errors[:] = False

    total_error_count = 0

    repeat_instance_dict = {}  # Dict from recordid to repeat instance number, auto-increment from 1

    recordid_field = data_dictionary[0]
    form_fields = [f for f in data_dictionary if f.form_name == form_name or f.field_name == recordid_field.field_name]

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
        # Figure out leading zeros problem
        # if redcap_field.field_name == 'mrn1':
        #     print(current_list)
        if redcap_field.field_type in ['text', 'notes']:
            for idx, item in enumerate(current_list):
                if not item and redcap_field.required:
                    all_errors.append("Required field missing for {0} at index {1}.".format(redcap_field.field_name, idx))
            validations = validate_text_type(current_list, redcap_field)
            instrument_errors[redcap_field.field_name] = [d is False for d in validations]
        elif redcap_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox']:
            choices_dict = redcap_field.choices_dict
            for idx, item in enumerate(current_list):
                if not item and redcap_field.required:
                    all_errors.append("Required field missing for {0} at index {1}.".format(redcap_field.field_name, idx))
                elif item and item not in choices_dict:
                    all_errors.append("{0} not found in Permissible Values: {1}".format(item, str(choices_dict)))
            if redcap_field.required:
                instrument_errors[redcap_field.field_name] = [not d or d not in choices_dict for d in current_list]
            else:
                instrument_errors[redcap_field.field_name] = [d not in choices_dict if d else None for d in current_list]

            if redcap_field.field_type == 'checkbox':
                for key, value in choices_dict.items():
                    checked_list = [1 if key == d else 0 for d in current_list]
                    output_records["{0}__{1}".format(redcap_field.field_name, value)] = checked_list
                output_records.drop(redcap_field.field_name, 1, inplace=True)
            else:
                current_list = [int(item) if isinstance(item, numbers.Number) and float(item).is_integer() else item for item in current_list]
                replaced_choices = [choices_dict.get(item) for item in current_list]
                output_records[redcap_field.field_name] = replaced_choices
        else:
            raise Exception('Unrecognized field_type: {0}'.format(redcap_field.field_type))

        total_error_count += len([d for d in instrument_errors[redcap_field.field_name] if d is True])

    if total_error_count > 0:
        return output_records, instrument_errors
    else:
        return output_records, None


def lint_datafile(data_dictionary, records, project_info):
    recordid_field = data_dictionary[0]
    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))

    instruments_with_errors = []
    original_records = {}
    datafile_errors = {}
    encoded_records = {}
    record_fields_not_in_redcap = {}

    all_errors = []

    for instrument in records.keys():
        sheet_name = utils.parameterize(instrument)
        instrument_records = records.get(instrument)
        original_records[instrument] = instrument_records.copy()
        instrument_errors = pd.DataFrame().reindex_like(instrument_records)
        instrument_errors.columns = utils.parameterize_list(instrument_errors.columns.tolist())
        instrument_errors[:] = False
        datafile_errors[instrument] = instrument_errors

        if sheet_name not in form_names:
            all_errors.append("Sheet {0} not found in form names of data dictionary.".format(instrument))
            continue

        instrument_records.columns = utils.parameterize_list(instrument_records.columns.tolist())
        recordid_field = data_dictionary[0]
        form_fields = [field for field in data_dictionary if field.form_name == sheet_name or field.field_name == recordid_field.field_name]

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

    normalized_instruments_dict = dict(zip(utils.parameterize_list(records.keys()), records.keys()))

    for instrument in form_names:
        repeatable = instrument in utils.parameterize_list(project_info['repeatable_instruments'])
        sheet_name = normalized_instruments_dict.get(instrument)
        instrument_records = records.get(sheet_name)
        if instrument_records is not None:
            output, errors = lint_instrument(data_dictionary, instrument, instrument_records, repeatable, all_errors)
            encoded_records[sheet_name] = output
            if errors is not None:
                encoded_records[sheet_name] = output
                instruments_with_errors.append(instrument)
                datafile_errors[sheet_name] = errors
        else:
            all_errors.append("Instrument {0} not found in datafile.".format(instrument))

    all_errors = [{"error": error} for error in all_errors]

    return datafile_errors, record_fields_not_in_redcap, all_errors
