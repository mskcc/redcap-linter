import json
import io
import os
import ntpath
from datetime import datetime
from collections import OrderedDict

import flask
from flask import request, Blueprint
import pandas as pd

from models.redcap_field import RedcapField
from linter import linter
from serializers import serializer

EXPORT = Blueprint('export', __name__)

@EXPORT.route('/download_progress', methods=['GET', 'POST', 'OPTIONS'])
def download_progress():
    form = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    data_field_to_redcap_field_map = json.loads(form.get('dataFieldToRedcapFieldMap'))
    csv_headers = json.loads(form.get('csvHeaders'))
    data_dictionary = [RedcapField.from_json(field) for field in json.loads(form.get('ddData'))]
    cells_with_errors = json.loads(form.get('cellsWithErrors'))
    record_fields_not_in_redcap = json.loads(form.get('recordFieldsNotInRedcap'))

    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Edited.xlsx'
    json_data = json.loads(form.get('jsonData'), object_pairs_hook=OrderedDict)

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')

    error_format = writer.book.add_format({'bg_color': '#ffbf00'}) # Amber
    empty_format = writer.book.add_format({'bg_color': '#FFE300'}) # Yellow
    missing_column_format = writer.book.add_format({'bg_color': '#E5153E'}) # Red
    for sheet in json_data:
        matched_field_dict = data_field_to_redcap_field_map.get(sheet, {})
        csv_headers[sheet] = [matched_field_dict.get(c) or c for c in csv_headers[sheet]]
        error_df = pd.DataFrame(cells_with_errors[sheet])
        frame = pd.DataFrame(json_data[sheet])
        frame.fillna('', inplace=True)
        frame.rename(columns=matched_field_dict, inplace=True)
        error_df.rename(columns=matched_field_dict, inplace=True)
        frame = frame[csv_headers[sheet]]
        error_df = error_df[csv_headers[sheet]]
        frame.to_excel(writer, sheet_name=sheet, index=False)

        data_worksheet = writer.sheets[sheet]
        for j, col in enumerate(error_df.columns):
            if col in record_fields_not_in_redcap.get(sheet, []):
                data_worksheet.write(0, j, frame.columns[j], missing_column_format)
                continue
            for index, _ in error_df.iterrows():
                error_cell = error_df.iloc[index][col]
                required = False
                dd_field = [f for f in data_dictionary if f.field_name == col]
                if dd_field:
                    required = dd_field[0].required
                if error_cell is None and required:
                    data_worksheet.write(index + 1, j, '', empty_format)
                elif error_cell:
                    cell = frame.iloc[index][frame.columns[j]]
                    target_string = cell or ''
                    cell_format = None
                    if cell:
                        cell_format = error_format
                    elif required:
                        cell_format = empty_format
                    data_worksheet.write(index + 1, j, target_string, cell_format)
    writer.close()
    output.seek(0)
    return flask.send_file(output, attachment_filename=new_datafile_name, as_attachment=True)

@EXPORT.route('/download_mappings', methods=['GET', 'POST', 'OPTIONS'])
def download_mappings():
    form = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    data_field_to_redcap_field_map = json.loads(form.get('dataFieldToRedcapFieldMap'))
    data_field_to_choice_map = json.loads(form.get('dataFieldToChoiceMap'))
    original_to_correct_value_map = json.loads(form.get('originalToCorrectedValueMap'))
    no_match_redcap_fields = json.loads(form.get('noMatchRedcapFields'))

    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Mappings.xlsx'

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')

    frame = pd.DataFrame({'dataFieldToRedcapFieldMap': [json.dumps(data_field_to_redcap_field_map)],
                          'dataFieldToChoiceMap': [json.dumps(data_field_to_choice_map)],
                          'originalToCorrectedValueMap': [json.dumps(original_to_correct_value_map)],
                          'noMatchRedcapFields': [json.dumps(no_match_redcap_fields)]})

    frame.to_excel(writer, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output, attachment_filename=new_datafile_name, as_attachment=True)

@EXPORT.route('/download_output', methods=['GET', 'POST', 'OPTIONS'])
def download_output():
    form = request.form.to_dict()
    datafile_name = form.get('dataFileName')
    encoded_records = json.loads(form.get('encodedRecords'))
    encoded_record_headers = json.loads(form.get('encodedRecordHeaders'))
    datafile_name = os.path.splitext(ntpath.basename(datafile_name))[0]
    current_date = datetime.now().strftime("%m-%d-%Y")
    new_datafile_name = datafile_name + '-' + current_date + '-Encoded.xlsx'

    for sheet in encoded_records:
        frame = pd.DataFrame(encoded_records[sheet])
        frame = frame[encoded_record_headers[sheet]]
        encoded_records[sheet] = frame

    output = io.BytesIO()
    writer = pd.ExcelWriter(output, engine='xlsxwriter')
    for sheet, form in encoded_records.items():
        form.to_excel(writer, sheet_name=sheet, index=False)
    writer.close()
    output.seek(0)
    return flask.send_file(output, attachment_filename=new_datafile_name, as_attachment=True)
