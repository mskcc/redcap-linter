import pandas as pd

from utils import utils

def encode_sheet(data_dictionary, project_info, records, rows_in_error=[]):
    encoded_fields = {}

    recordid_field = utils.get_recordid_field(data_dictionary, project_info)

    matching_fields = utils.get_matching_fields(data_dictionary, records, recordid_field)

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
                encoded_row = encode_row(row, matching_fields[form_name], encoded_fields=encoded_fields[form_name], encoded_row=encoded_row)
                if form_name in project_info.get('repeatable_instruments'):
                    row_to_encode = encode_row(row, matching_fields[form_name], encoded_fields=encoded_fields[form_name])
                    row_to_encode['redcap_repeat_instrument'] = form_name
                    row_to_encode['redcap_repeat_instance'] = repeat_instance_dict.get(row[recordid_field.field_name])
                    output_records = output_records.append(row_to_encode, ignore_index=True)
            output_records = output_records.append(encoded_row, ignore_index=True)

    if project_info.get('record_autonumbering_enabled') == 1:
        record_inst = project_info.get('next_record_name')
        for index, row in records.iterrows():
            encoded_row = {'record_id': record_inst}
            if int(index) in rows_in_error:
                continue
            for form_name in matching_fields:
                # Cannot do repeatable instruments if autonumbered for now
                if form_name in project_info.get('repeatable_instruments'):
                    continue
                encoded_row = encode_row(row, matching_fields[form_name], encoded_fields=encoded_fields[form_name], encoded_row=encoded_row)
            output_records = output_records.append(encoded_row, ignore_index=True)
            record_inst += 1

    return output_records

def decode_sheet(data_dictionary, project_info, records):
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
