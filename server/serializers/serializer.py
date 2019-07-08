from dateutil.parser import parse
import logging

import pandas as pd

from utils import utils

def encode_datafile(data_dictionary, project_info, records, options={}):
    encoded_records = {}

    for sheet_name, sheet in records.items():
        if sheet is not None:
            sheet_options = {
                'rows_in_error': options.get('rows_in_error', {}).get(sheet_name, []),
                'matching_repeat_instances': options.get('matching_repeat_instances', {}).get(sheet_name, {}),
                'matching_record_ids': options.get('matching_record_ids', {}).get(sheet_name, {}),
                'decoded_records': options.get('decoded_records', {}),
            }

            encoded_records[sheet_name] = encode_sheet(data_dictionary, project_info, sheet, sheet_options)

    return encoded_records

def encode_sheet(data_dictionary, project_info, records, options={}):
    encoded_fields = {}

    recordid_field = data_dictionary[0]

    unique_field = utils.get_unique_field(data_dictionary, project_info)

    matching_fields = utils.get_matching_fields(data_dictionary, records, recordid_field)

    rows_in_error = options.get('rows_in_error', [])
    decoded_records = options.get('decoded_records', {})
    matching_repeat_instances = options.get('matching_repeat_instances', {})
    matching_record_ids = options.get('matching_record_ids', {})

    for form_name in matching_fields:
        encoded_fields[form_name] = []
        for redcap_field in matching_fields[form_name]:
            if redcap_field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
                current_list = [str(int(i)) if isinstance(i, float) and i.is_integer() else i for i in list(records[redcap_field.field_name])]
                current_list = [str(item) for item in current_list]
                is_encoded = all([item in redcap_field.choices_dict.values() or item == '' for item in current_list])
                if is_encoded:
                    encoded_fields[form_name].append(redcap_field.field_name)

    output_records = pd.DataFrame()
    output_records.insert(0, recordid_field.field_name, None)
    output_records.insert(1, 'redcap_repeat_instrument', None)
    output_records.insert(2, 'redcap_repeat_instance', None)

    # Counts repeats of recordid in the datafile
    repeat_instance_dict = {}
    if project_info.get('record_autonumbering_enabled') == 0 and unique_field.field_name not in list(records.columns):
        return output_records

    next_inst = project_info.get('next_record_name', 1)
    for index, row in records.iterrows():
        encoded_row = {}
        record_inst = None
        if int(index) in rows_in_error:
            continue

        if str(index) in matching_record_ids:
            record_inst = matching_record_ids.get(str(index))
        else:
            record_inst = next_inst
            next_inst += 1

        if project_info.get('record_autonumbering_enabled') == 1:
            encoded_row[recordid_field.field_name] = record_inst

        if row.get(unique_field.field_name):
            if not repeat_instance_dict.get(row[unique_field.field_name]):
                repeat_instance_dict[row[unique_field.field_name]] = 1
            else:
                repeat_instance_dict[row[unique_field.field_name]] += 1

        for form_name in matching_fields:
            if form_name in project_info.get('repeatable_instruments'):
                row_to_encode = {}
                if project_info.get('record_autonumbering_enabled') == 1:
                    row_to_encode[recordid_field.field_name] = record_inst
                row_to_encode = encode_row(row, matching_fields[form_name], encoded_fields=encoded_fields[form_name], encoded_row=row_to_encode)
                row_to_encode['redcap_repeat_instrument'] = form_name
                max_instance_number = 0
                for decoded_record in decoded_records.get(str(row.get(recordid_field.field_name)), []):
                    if decoded_record['redcap_repeat_instrument'] == form_name and int(decoded_record['redcap_repeat_instance']) > max_instance_number:
                        max_instance_number = int(decoded_record['redcap_repeat_instance'])
                repeat_instance = max_instance_number + repeat_instance_dict.get(row[unique_field.field_name])
                if matching_repeat_instances.get(str(index), {}).get(form_name):
                    repeat_instance = matching_repeat_instances.get(str(index), {}).get(form_name)
                row_to_encode['redcap_repeat_instance'] = repeat_instance
                output_records = output_records.append(row_to_encode, ignore_index=True)
            else:
                encoded_row = encode_row(row, matching_fields[form_name], encoded_fields=encoded_fields[form_name], encoded_row=encoded_row)
        output_records = output_records.append(encoded_row, ignore_index=True)

    return output_records

def decode_sheet(data_dictionary, records):
    decoded_rows = []

    for record in records:
        decoded_row = {}
        for field in data_dictionary:
            if field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
                choices_dict = {v: k for k, v in field.choices_dict.items()}
                decoded_row[field.field_name] = choices_dict.get(record[field.field_name])
            elif field.field_type in ['checkbox']:
                selected_choices = []
                checkbox_items = [str(f).lower() for f in field.choices_dict.keys()]
                for item in checkbox_items:
                    if record['{0}___{1}'.format(field.field_name, item)] == '1':
                        selected_choices.append(item)
                decoded_row[field.field_name] = ','.join(selected_choices)
            else:
                if record[field.field_name] and field.text_validation in ['date_dmy', 'date_mdy', 'date_ymd']:
                    decoded_value = record[field.field_name]
                    try:
                        decoded_value = parse(record[field.field_name]).strftime('%m/%d/%Y')
                    except:
                        logging.warning(decoded_value)
                    decoded_row[field.field_name] = decoded_value
                else:
                    decoded_row[field.field_name] = record[field.field_name]
        decoded_row['redcap_repeat_instrument'] = record['redcap_repeat_instrument']
        decoded_row['redcap_repeat_instance'] = record['redcap_repeat_instance']
        decoded_rows.append(decoded_row)
    return decoded_rows

def encode_row(row, dd_fields, encoded_fields=[], encoded_row={}):
    for field in dd_fields:
        if field.field_type in ['radio', 'dropdown', 'yesno', 'truefalse']:
            if field.field_name in encoded_fields:
                encoded_row[field.field_name] = row[field.field_name]
            else:
                choice_match = row[field.field_name]
                choice_match = str(int(choice_match)) if isinstance(choice_match, float) and choice_match.is_integer() else str(choice_match)
                encoded_row[field.field_name] = field.choices_dict.get(choice_match)
        elif field.field_type in ['checkbox']:
            permissible_values = [str(i).lower() for i in field.choices_dict.keys()]
            checkbox_items = [i.strip().lower() for i in row[field.field_name].split(',')]
            for permissible_value in permissible_values:
                if permissible_value in checkbox_items:
                    encoded_row['{0}___{1}'.format(field.field_name, permissible_value)] = 1
                else:
                    encoded_row['{0}___{1}'.format(field.field_name, permissible_value)] = 0
        else:
            encoded_row[field.field_name] = row[field.field_name]
    return encoded_row
