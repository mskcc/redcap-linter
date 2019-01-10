import logging
import re

import pandas as pd
from dateutil import parser

from flask import current_app

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
            for index, row in instrument_errors.iterrows():
                error_cell = instrument_errors.iloc[index][col]
                if error_cell is None:
                    data_worksheet.write(index + 1, j, '', empty_format)
                elif error_cell:
                    cell = df.iloc[index][df.columns[j]]
                    target_string = cell or ''
                    data_worksheet.write(index + 1, j, target_string, error_format)

    writer.save()


def write_encoded_records_to_csv(encoded_records):
    # TODO output all these on one sheet.
    for key in encoded_records:
        encoded_records.get(key).to_csv('{0}_output.csv'.format(key), index=False)


def titleize(str):
    return str.replace('_', ' ').title()


def get_from_data_dictionary(data_dictionary, field_name, col):
    cell = list(data_dictionary.loc[data_dictionary['variable_field_name'] == field_name, col])
    if len(cell) > 0:
        return list(data_dictionary.loc[data_dictionary['variable_field_name'] == field_name, col])[0]
    else:
        return None


def validate_numbers(numbers_list, number_format, number_min, number_max, required):
    formatted_numbers = []
    for d in numbers_list:
        if not d:
            if required:
                logging.error("Required field missing.")
                formatted_numbers.append(False)
            else:
                formatted_numbers.append(None)
        elif ((number_min and d < number_min) or
              (number_max and d > number_max)):
            logging.error("{0} is outside the acceptable range. min: {0}, max: {1}".format(number_min, number_max))
            formatted_numbers.append(False)
        else:
            if number_format == 'number_2dp':
                formatted_numbers.append("{:.2f}".format(d))
            elif number_format == 'integer':
                if float(d).is_integer():
                    formatted_numbers.append("{:.0f}".format(d))
                else:
                    logging.error("Integer validation failed: {0}".format(d))
                    formatted_numbers.append(False)

    return formatted_numbers


def validate_dates(date_list, date_format, date_min, date_max, required):
    # current_app.logger.info(date_list)
    formatted_dates = []
    for d in date_list:
        if not d:
            if required:
                logging.error("Required field missing.")
                formatted_dates.append(False)
            else:
                formatted_dates.append(None)
        elif ((date_min and d < parser.parse(date_min)) or
              (date_max and d > parser.parse(date_max))):
            logging.warning("{0} is outside the acceptable range. min: {0}, max: {1}".format(date_min, date_max))
            formatted_dates.append(False)
        else:
            if isinstance(d, str):
                d = parser.parse(d)
            if date_format == 'date_mdy':
                formatted_dates.append(d.strftime("%m/%d/%Y"))
            elif date_format == 'date_dmy':
                formatted_dates.append(d.strftime("%d/%m/%Y"))
            elif date_format == 'date_ymd':
                formatted_dates.append(d.strftime("%Y/%m/%d"))

    return formatted_dates


def parameterize(str):
    # \W = [^a-zA-Z0-9_]
    parameterized_str = re.sub(r'([^\s\w-]|_)+', '', str)
    parameterized_str = re.sub('\s+', '_', parameterized_str)
    parameterized_str = parameterized_str.lower()
    return parameterized_str


def parameterize_list(items):
    return [parameterize(item) for item in items]


def read_spreadsheet(filename, **kwargs):
    records = None
    if filename.endswith('.csv'):
        records = pd.read_csv(filename, dtype=str)
        records.fillna('', inplace=True)
    elif filename.endswith('.xlsx') or filename.endswith('.xls'):
        excel = pd.ExcelFile(filename)
        records = pd.read_excel(filename, sheet_name=None, dtype=str)
        for key in records:
            records.get(key).replace('nan', '', inplace=True)
    else:
        raise Exception('Spreadsheet must be of type .csv, .xlsx or .xls')
    return records
