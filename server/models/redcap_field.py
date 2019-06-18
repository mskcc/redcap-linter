import logging
import json

def get_from_data_dictionary(data_dictionary, field_name, col):
    cell = list(data_dictionary.loc[data_dictionary['Variable / Field Name'] == field_name, col])
    if len(cell) > 0:
        return list(data_dictionary.loc[data_dictionary['Variable / Field Name'] == field_name, col])[0]
    else:
        return None

class RedcapField(object):
    yesno_dict = {'Yes': '1', 'No': '0', 'Y': '1', 'N': '0', '1': '1', '0': '0', 'True': '1', 'False': '0'}

    def __init__(self, **kwargs):
        self.field_name = kwargs.get('field_name')
        self.field_label = kwargs.get('field_label')
        self.field_type = kwargs.get('field_type')
        self.text_validation = kwargs.get('text_validation')
        self.text_min = kwargs.get('text_min')
        self.text_max = kwargs.get('text_max')
        self.choices = kwargs.get('choices')
        self.form_name = kwargs.get('form_name')
        self.required = kwargs.get('required')
        self.choices_dict = kwargs.get('choices_dict')

    @classmethod
    def from_data_dictionary(cls, data_dictionary, field_name):
        field = {
            'field_name': field_name,
            'field_label': get_from_data_dictionary(data_dictionary, field_name, 'Field Label'),
            'field_type': get_from_data_dictionary(data_dictionary, field_name, 'Field Type'),
            'text_validation': get_from_data_dictionary(data_dictionary, field_name, 'Text Validation Type OR Show Slider Number'),
            'text_min': get_from_data_dictionary(data_dictionary, field_name, 'Text Validation Min'),
            'text_max': get_from_data_dictionary(data_dictionary, field_name, 'Text Validation Max'),
            'choices': get_from_data_dictionary(data_dictionary, field_name, 'Choices, Calculations, OR Slider Labels'),
            'form_name': get_from_data_dictionary(data_dictionary, field_name, 'Form Name'),
            'required': get_from_data_dictionary(data_dictionary, field_name, 'Required Field?') in ['y', 'Y']
        }

        if field['field_type'] in ['yesno', 'truefalse']:
            field['choices_dict'] = cls.yesno_dict
        elif field['field_type'] in ['radio', 'dropdown', 'checkbox']:
            c = [choice.split(',', 1) for choice in field['choices'].split('|')]
            field['choices_dict'] = {choice[1].strip(): choice[0].strip() for choice in c if len(choice) == 2}

        return cls(**field)


    @classmethod
    def from_json(cls, field_json):
        field = {
            'field_name': field_json.get('field_name') or field_json.get('Variable / Field Name'),
            'field_label': field_json.get('field_label') or field_json.get('Field Label'),
            'field_type': field_json.get('field_type') or field_json.get('Field Type'),
            'text_validation': field_json.get('text_validation') or field_json.get('Text Validation Type OR Show Slider Number') or field_json.get('text_validation_type_or_show_slider_number'),
            'text_min': field_json.get('text_min') or field_json.get('Text Validation Min') or field_json.get('text_validation_min'),
            'text_max': field_json.get('text_max') or field_json.get('Text Validation Max') or field_json.get('text_validation_max'),
            'choices': field_json.get('choices') or field_json.get('Choices, Calculations, OR Slider Labels') or field_json.get('select_choices_or_calculations'),
            'form_name': field_json.get('form_name') or field_json.get('Form Name'),
            'required': field_json.get('required') or field_json.get('Required Field?') in ['y', 'Y'] or field_json.get('required_field'),
            'choices_dict': field_json.get('choices_dict')
        }

        if field_json['field_type'] in ['yesno', 'truefalse']:
            field['choices_dict'] = cls.yesno_dict
        elif field_json['field_type'] in ['radio', 'dropdown', 'checkbox']:
            c = [choice.split(',', 1) for choice in field.get('choices').split('|')]
            field['choices_dict'] = {choice[1].strip(): choice[0].strip() for choice in c if len(choice) == 2}

        return cls(**field)

    def __str__(self):
        return json.dumps(self.__dict__)
