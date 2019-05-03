import pandas as pd
import logging
import datetime
import os
import numbers
from models.redcap_field import RedcapField
from api.redcap.redcap_api import RedcapApi
from utils import utils
import flask
from serializers import serializer

app = flask.Flask(__name__)
app.logger.setLevel(logging.INFO)

def lint_sheet(data_dictionary, project_info, records):
    instrument_errors = pd.DataFrame().reindex_like(records)
    instrument_errors[:] = False

    all_errors = []
    rows_in_error = []

    total_error_count = 0

    recordid_field = utils.get_recordid_field(data_dictionary, project_info)

    matching_fields = utils.get_matching_fields(data_dictionary, records, recordid_field)

    for form_name in matching_fields:
        for redcap_field in matching_fields[form_name]:
            current_list = list(records[redcap_field.field_name])
            current_list = [i.strip() if isinstance(i, str) else i for i in current_list]

            for idx, item in enumerate(current_list):
                if (pd.isnull(item) or not item) and (redcap_field.required or redcap_field.field_name == recordid_field.field_name):
                    rows_in_error.append(idx)
                    all_errors.append("Required field missing for {0} at index {1}.".format(redcap_field.field_name, idx))

            if redcap_field.field_type in ['text', 'notes']:
                validations = utils.validate_text_type(current_list, redcap_field)
                formatted_values = current_list
                if redcap_field.text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
                    formatted_values = utils.format_dates(current_list, redcap_field.text_validation)
                records[redcap_field.field_name] = formatted_values
                instrument_errors[redcap_field.field_name] = [d is False for d in validations]
                for idx, valid in enumerate(validations):
                    if valid is False:
                        rows_in_error.append(idx)
            elif redcap_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
                choices_dict = redcap_field.choices_dict
                # Always do this or just for yesno/truefalse?
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]
                current_list = [str(item) for item in current_list]
                is_encoded = all([item in choices_dict.values() or item == '' for item in current_list])
                for idx, item in enumerate(current_list):
                    if item and item not in choices_dict and not is_encoded:
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

    rows_in_error = list(set(rows_in_error))
    rows_in_error.sort()

    output_records = serializer.encode_sheet(data_dictionary, project_info, records, rows_in_error)
    # logging.warning(rows_in_error)

    return {
        'encoded_records': output_records,
        'instrument_errors': instrument_errors,
        'rows_in_error': rows_in_error,
        'all_errors': all_errors,
    }


def lint_datafile(data_dictionary, records, project_info):
    all_errors = []

    recordid_field = utils.get_recordid_field(data_dictionary, project_info)

    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))

    cells_with_errors = {}
    rows_in_error = {}
    encoded_records = {}

    for sheet_name in records.keys():
        instrument_records = records.get(sheet_name)
        if recordid_field.field_name not in instrument_records.columns:
            all_errors.append("Primary key {0} not present in sheet {1}.".format(recordid_field.field_name, sheet_name))

        instrument_errors = pd.DataFrame().reindex_like(instrument_records)
        instrument_errors[:] = False
        cells_with_errors[sheet_name] = instrument_errors

    for sheet_name in records.keys():
        sheet = records.get(sheet_name)
        if sheet is not None:
            results = lint_sheet(data_dictionary, project_info, sheet)
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
            results = lint_sheet(data_dictionary, project_info, sheet)
            encoded_records[sheet_name] = results['encoded_records']

    return encoded_records
