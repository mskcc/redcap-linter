from utils import utils
import logging
import json


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
            'field_label': utils.get_from_data_dictionary(data_dictionary, field_name, 'Field Label'),
            'field_type': utils.get_from_data_dictionary(data_dictionary, field_name, 'Field Type'),
            'text_validation': utils.get_from_data_dictionary(data_dictionary, field_name, 'Text Validation Type OR Show Slider Number'),
            'text_min': utils.get_from_data_dictionary(data_dictionary, field_name, 'Text Validation Min'),
            'text_max': utils.get_from_data_dictionary(data_dictionary, field_name, 'Text Validation Max'),
            'choices': utils.get_from_data_dictionary(data_dictionary, field_name, 'Choices, Calculations, OR Slider Labels'),
            'form_name': utils.get_from_data_dictionary(data_dictionary, field_name, 'Form Name'),
            'required': utils.get_from_data_dictionary(data_dictionary, field_name, 'Required Field?') in ['y', 'Y']
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
            'text_validation': field_json.get('text_validation') or field_json.get('Text Validation Type OR Show Slider Number'),
            'text_min': field_json.get('text_min') or field_json.get('Text Validation Min'),
            'text_max': field_json.get('text_max') or field_json.get('Text Validation Max'),
            'choices': field_json.get('choices') or field_json.get('Choices, Calculations, OR Slider Labels'),
            'form_name': field_json.get('form_name') or field_json.get('Form Name'),
            'required': field_json.get('required') or field_json.get('Required Field?') in ['y', 'Y'],
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
