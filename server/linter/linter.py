"""This module scans the datafile to find cells that violate the data dictionary"""

import pandas as pd

import logging

from utils import utils

# TODO Consider switching to processing by rows and creating a RecordRow object
def lint_list(redcap_field, current_list, all_errors=[]):
    current_list = [i.strip() if isinstance(i, str) else i for i in current_list]

    list_errors = []
    row_errors = []
    list_formatted = current_list
    for idx, item in enumerate(current_list):
        if (pd.isnull(item) or not item) and redcap_field.required:
            row_errors.append(idx)
            all_errors.append("Required field missing for {0} at index {1}.".format(redcap_field.field_name, idx))

    if redcap_field.field_type in ['text', 'notes']:
        validations = utils.validate_text_type(current_list, redcap_field)
        formatted_values = current_list
        if redcap_field.text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
            formatted_values = utils.format_dates(current_list, redcap_field.text_validation)
        list_formatted = formatted_values
        list_errors = [d is False for d in validations]
        for idx, valid in enumerate(validations):
            if valid is False:
                row_errors.append(idx)
                all_errors.append("{0} did not pass date validation {1}. Min: {2} | Max: {3}".format(formatted_values[idx], redcap_field.text_validation, redcap_field.text_min, redcap_field.text_max))
    elif redcap_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
        choices_dict = redcap_field.choices_dict
        # Always do this or just for yesno/truefalse?
        current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in current_list]
        current_list = [str(item) for item in current_list]
        is_encoded = all([item in choices_dict.values() or item == '' for item in current_list])
        for idx, item in enumerate(current_list):
            if item and item not in choices_dict and not is_encoded:
                row_errors.append(idx)
                all_errors.append("{0} not found in Permissible Values: {1}".format(item, str(choices_dict)))
        errors = []
        for idx, item in enumerate(current_list):
            if not item:
                has_error = True if redcap_field.required else None
                errors.append(has_error)
            else:
                has_error = False if is_encoded else (item not in choices_dict)
                errors.append(has_error)
        list_errors = errors
    elif redcap_field.field_type in ['checkbox']:
        current_list = [str(item) for item in current_list]
        errors = []
        for idx, item in enumerate(current_list):
            if not item:
                has_error = True if redcap_field.required else None
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
                    row_errors.append(idx)
                errors.append(has_error)
        list_errors = errors
    else:
        raise Exception('Unrecognized field_type: {0}'.format(redcap_field.field_type))

    return {
        "list_errors": list_errors,
        "list_formatted": list_formatted,
        "row_errors": row_errors,
    }

def lint_sheet(data_dictionary, project_info, records):
    instrument_errors = pd.DataFrame().reindex_like(records)
    instrument_errors[:] = False

    all_errors = []
    rows_in_error = []

    recordid_field = data_dictionary[0]

    matching_fields = utils.get_matching_fields(data_dictionary, records, recordid_field)

    for form_name in matching_fields:
        for redcap_field in matching_fields[form_name]:
            current_list = list(records[redcap_field.field_name])

            processed_list = lint_list(redcap_field, current_list, all_errors)
            instrument_errors[redcap_field.field_name] = processed_list['list_errors']
            records[redcap_field.field_name] = processed_list['list_formatted']
            rows_in_error += processed_list['row_errors']

    rows_in_error = list(set(rows_in_error))
    rows_in_error.sort()

    return {
        'instrument_errors': instrument_errors,
        'rows_in_error': rows_in_error,
        'all_errors': all_errors,
    }


def lint_datafile(data_dictionary, project_info, records):
    all_errors = []

    recordid_field = data_dictionary[0]

    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))

    cells_with_errors = {}
    rows_in_error = {}

    for sheet_name, instrument_records in records.items():
        if project_info['record_autonumbering_enabled'] == 0:
            if recordid_field.field_name not in instrument_records.columns:
                all_errors.append("Recordid Field {0} not present in sheet {1}.".format(recordid_field.field_name, sheet_name))
        else:
            for field in project_info.get('secondary_unique_field', []):
                if field not in instrument_records.columns:
                    all_errors.append("Field in Secondary Unique Field {0} not present in sheet {1}.".format(field, sheet_name))

        instrument_errors = pd.DataFrame().reindex_like(instrument_records)
        instrument_errors[:] = False
        cells_with_errors[sheet_name] = instrument_errors

    for sheet_name, sheet in records.items():
        if sheet is not None:
            results = lint_sheet(data_dictionary, project_info, sheet)
            all_errors += results['all_errors']
            cells_with_errors[sheet_name] = results['instrument_errors']
            if results['rows_in_error']:
                rows_in_error[sheet_name] = results['rows_in_error']

    return {
        'cells_with_errors': cells_with_errors,
        'rows_in_error': rows_in_error,
        'linting_errors': all_errors
    }
