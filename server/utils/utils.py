import logging
import re

import pandas as pd
from dateutil import parser

DECIMAL_PATTERN = re.compile("^[-+]?\d+\.[0-9]{2}$")
INTEGER_PATTERN = re.compile("^[-+]?\d+$")

def write_errors_to_excel(original_records, errors, error_cols):
    writer = pd.ExcelWriter('datafile_errors.xlsx', engine='xlsxwriter')

    error_format = writer.book.add_format({'bg_color': '#CC4400'}) # Amber
    empty_format = writer.book.add_format({'bg_color': '#FFFF00'}) # Yellow
    missing_column_format = writer.book.add_format({'bg_color': '#FF0000'}) # Red

    for instrument in original_records:
        df = original_records.get(instrument)
        df.to_excel(writer, sheet_name=instrument, index=False)
        data_worksheet = writer.sheets[instrument]

        instrument_errors = errors.get(instrument)
        for j, col in enumerate(instrument_errors.columns):
            if error_cols.get(instrument) is not None and col in error_cols.get(instrument):
                data_worksheet.write(0, j, df.columns[j], missing_column_format)
                continue
            for index, _ in instrument_errors.iterrows():
                error_cell = instrument_errors.iloc[index][col]
                if error_cell is None:
                    data_worksheet.write(index + 1, j, '', empty_format)
                elif error_cell:
                    cell = df.iloc[index][df.columns[j]]
                    target_string = cell or ''
                    data_worksheet.write(index + 1, j, target_string, error_format)

    writer.save()

def validate_numbers(numbers_list, number_format, number_min, number_max, required):
    formatted_numbers = []
    if number_min and isinstance(number_min, str):
        number_min = float(number_min)
    if number_max and isinstance(number_max, str):
        number_max = float(number_max)
    for number_str in numbers_list:
        if not number_str or pd.isnull(number_str):
            is_valid = False if required else None
            formatted_numbers.append(is_valid)
            continue
        try:
            d = float(number_str)
        except ValueError:
            formatted_numbers.append(False)
            continue
        if ((number_min and d < number_min) or
              (number_max and d > number_max)):
            logging.error("{0} is outside the acceptable range. min: {1}, max: {2}".format(d, number_min, number_max))
            formatted_numbers.append(False)
        else:
            if number_format == 'number_2dp':
                if DECIMAL_PATTERN.fullmatch(str(number_str)):
                    formatted_numbers.append("{:.2f}".format(d))
                else:
                    logging.error("Expected decimal point with 2 places, but received: {0}".format(d))
                    formatted_numbers.append(False)
            elif number_format == 'integer':
                if INTEGER_PATTERN.fullmatch(str(number_str)):
                    formatted_numbers.append("{:.0f}".format(d))
                else:
                    logging.error("Integer validation failed: {0}".format(d))
                    formatted_numbers.append(False)

    return formatted_numbers


def validate_dates(date_list, date_format, date_min, date_max, required):
    formatted_dates = []

    if date_min and isinstance(date_min, str):
        date_min = parser.parse(date_min)
    if date_max and isinstance(date_max, str):
        date_max = parser.parse(date_max)

    if date_min:
        date_min = date_min.replace(tzinfo=None)
    if date_max:
        date_max = date_max.replace(tzinfo=None)
    for d in date_list:
        if not d or pd.isnull(d):
            is_valid = False if required else None
            formatted_dates.append(is_valid)
            continue
        try:
            if isinstance(d, str):
                d = parser.parse(d)
            d = d.replace(tzinfo=None)
            if ((date_min and d < date_min) or (date_max and d > date_max)):
                logging.warning("{0} is outside the acceptable range. min: {1}, max: {2}".format(d, date_min, date_max))
                formatted_dates.append(False)
            else:
                formatted_date = d.strftime("%m/%d/%Y")
                formatted_dates.append(True)
        except:
            formatted_dates.append(False)

    return formatted_dates


def format_dates(date_list, date_format):
    formatted_dates = []
    for d in date_list:
        if not d or pd.isnull(d):
            formatted_dates.append(None)
            continue
        try:
            if isinstance(d, str):
                d = parser.parse(d)
            if date_format == 'date_mdy':
                formatted_dates.append(d.strftime("%m/%d/%Y"))
            elif date_format == 'date_dmy':
                formatted_dates.append(d.strftime("%d/%m/%Y"))
            elif date_format == 'date_ymd':
                formatted_dates.append(d.strftime("%Y/%m/%d"))
        except:
            formatted_dates.append(d)
    return formatted_dates


def get_columns_with_errors(cells_with_errors, records):
    columns_in_error = {}
    for sheet_name in cells_with_errors:
        sheet_columns_in_error = []
        for f in list(cells_with_errors[sheet_name].columns):
            column_cells_with_errors = [d for idx, d in enumerate(list(records[sheet_name][f])) if list(cells_with_errors[sheet_name][f])[idx]]
            has_data = any(column_cells_with_errors)
            if not has_data:
                continue
            has_error = True in list(cells_with_errors[sheet_name][f])
            if has_error:
                sheet_columns_in_error.append(f)
        if sheet_columns_in_error:
            columns_in_error[sheet_name] = sheet_columns_in_error
    return columns_in_error

def get_rows_with_errors(cells_with_errors, records):
    rows_in_error = {}
    for sheet_name in cells_with_errors:
        sheet_rows_in_error = []
        for idx, row in enumerate(cells_with_errors[sheet_name].itertuples(index=False)):
            if True in row:
                sheet_rows_in_error.append(idx)
        if sheet_rows_in_error:
            rows_in_error[sheet_name] = sheet_rows_in_error
    return rows_in_error

def get_matching_fields(data_dictionary, records, recordid_field):
    form_fields = data_dictionary

    form_names = [redcap_field.form_name for redcap_field in data_dictionary]
    form_names = list(set(form_names))
    grouped_data_dictionary = {}
    for form in form_names:
        grouped_data_dictionary[form] = [field for field in data_dictionary if field.form_name == form or field.field_name == recordid_field.field_name]

    matching_fields = {}
    for form_name in grouped_data_dictionary:
        form_fields = [f for f in grouped_data_dictionary[form_name] if f.field_name in records.columns]
        if form_fields:
            matching_fields[form_name] = form_fields
    return matching_fields

def validate_text_type(list_to_validate, redcap_field):
    text_validation = redcap_field.text_validation
    text_min = redcap_field.text_min
    text_max = redcap_field.text_max
    required = redcap_field.required
    if text_validation in ['date_mdy', 'date_dmy', 'date_ymd']:
        validations = validate_dates(list_to_validate, text_validation, text_min, text_max, required)
    elif text_validation in ['number_2dp', 'integer']:
        validations = validate_numbers(list_to_validate, text_validation, text_min, text_max, required)
    elif text_validation in ['alpha_only']:
        validations = [str(i).isalpha() if i else None for i in list_to_validate]
    elif required:
        validations = [d != '' for d in list_to_validate]
    else:
        validations = list_to_validate
    return validations

def get_unique_field(data_dictionary, project_info):
    unique_field = None
    if project_info.get('record_autonumbering_enabled') == 1 and project_info.get('secondary_unique_field'):
        unique_field = [d for d in data_dictionary if d.field_name == project_info.get('secondary_unique_field')][0]
    else:
        unique_field = data_dictionary[0]
    return unique_field

def parameterize(str):
    # \W = [^a-zA-Z0-9_]
    parameterized_str = re.sub(r'([^\s\w-]|)+', '', str)
    parameterized_str = re.sub('\s+', '_', parameterized_str)
    parameterized_str = parameterized_str.lower()
    return parameterized_str


def parameterize_list(items):
    return [parameterize(item) for item in items]

def get_field_values(field_name, records):
    values = set()
    for _, sheet in records.items():
        for _, record in sheet.iterrows():
            if record.get(field_name):
                value = record.get(field_name)
                value = str(int(value)) if isinstance(value, float) and value.is_integer() else value
                values.add(value)
    values = list(values)
    return values

def read_spreadsheet(tempfile, filename):
    records = None
    if filename.endswith('.csv'):
        records = pd.read_csv(tempfile, dtype=str)
        records.fillna('', inplace=True)
        records = {
            'csv': records
        }
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        records = pd.read_excel(tempfile, sheet_name=None, dtype=str)
        for key in records:
            records.get(key).replace('nan', '', inplace=True)
    else:
        raise Exception('Spreadsheet must be of type .csv, .xlsx or .xls')
    return records
