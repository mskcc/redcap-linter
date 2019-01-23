from utils import utils
import json


class RedcapField(object):
    yesno_dict = {'Yes': '1', 'No': '0', 'Y': '1', 'N': '0', '1': '1', '0': '0', 'True': '1', 'False': '0'}

    def __init__(self, **kwargs):
        self.field_name = kwargs.get('field_name')
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
            'field_type': utils.get_from_data_dictionary(data_dictionary, field_name, 'field_type'),
            'text_validation': utils.get_from_data_dictionary(data_dictionary, field_name, 'text_validation_type_or_show_slider_number'),
            'text_min': utils.get_from_data_dictionary(data_dictionary, field_name, 'text_validation_min'),
            'text_max': utils.get_from_data_dictionary(data_dictionary, field_name, 'text_validation_max'),
            'choices': utils.get_from_data_dictionary(data_dictionary, field_name, 'choices_calculations_or_slider_labels'),
            'form_name': utils.get_from_data_dictionary(data_dictionary, field_name, 'form_name'),
            'required': utils.get_from_data_dictionary(data_dictionary, field_name, 'required_field') == 'y'
        }

        if field['field_type'] in ['yesno', 'truefalse']:
            field['choices_dict'] = cls.yesno_dict
        elif field['field_type'] in ['radio', 'dropdown', 'checkbox']:
            c = [choice.split(',') for choice in field['choices'].split('|')]
            field['choices_dict'] = {choice[1].strip(): choice[0].strip() for choice in c}

        return cls(**field)


    @classmethod
    def from_json(cls, field_json):
        field = {
            'field_name': field_json.get('field_name') or field_json.get('variable_field_name'),
            'field_type': field_json.get('field_type'),
            'text_validation': field_json.get('text_validation_type_or_show_slider_number'),
            'text_min': field_json.get('text_validation_min'),
            'text_max': field_json.get('text_validation_max'),
            'choices': field_json.get('select_choices_or_calculations') or field_json.get('choices_calculations_or_slider_labels'),
            'form_name': field_json.get('form_name'),
            'required': field_json.get('required_field') == 'y'
        }

        if field['field_type'] in ['yesno', 'truefalse']:
            field['choices_dict'] = cls.yesno_dict
        elif field['field_type'] in ['radio', 'dropdown', 'checkbox']:
            c = [choice.split(',') for choice in field['choices'].split('|')]
            field['choices_dict'] = {choice[1].strip(): choice[0].strip() for choice in c}

        return cls(**field)

    def __str__(self):
        return json.dumps(self.__dict__)
