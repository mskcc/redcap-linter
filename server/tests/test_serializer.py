import pytest
import os
import json

import logging

import sys
path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, path + '/../')

import pandas as pd
from pandas.testing import assert_frame_equal

from app import app
from models.redcap_field import RedcapField
from serializers import serializer

@pytest.fixture
def client():
    app.config['TESTING'] = True
    client = app.test_client()

    yield client

def test_serializer():

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "gender",
            "form_name": "demographics",
            "field_type": "radio",
            "choices": "1, female | 2, male | 3, unknown | 4, unspecified | 5, not reported"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': "",
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"gender": "male"},
        {"gender": "female"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    encoded_rows = serializer.encode_sheet(data_dictionary, project_info, records)

    d = {
        'record_id': [1, 2],
        'redcap_repeat_instrument': ['', ''],
        'redcap_repeat_instance': ['', ''],
        'gender': ['2', '1']
    }
    expected = pd.DataFrame(data=d)

    assert len(encoded_rows) == 2
    assert_frame_equal(encoded_rows, expected, check_dtype=False)


def test_serializer_with_record_id():

    data_dictionary = [
        {
            "field_name": "patient_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "gender",
            "form_name": "demographics",
            "field_type": "radio",
            "choices": "1, female | 2, male | 3, unknown | 4, unspecified | 5, not reported"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': "",
        'record_autonumbering_enabled': 0,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"patient_id": "123", "gender": "male"},
        {"patient_id": "456", "gender": "female"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    encoded_rows = serializer.encode_sheet(data_dictionary, project_info, records)

    d = {
        'patient_id': ["123", "456"],
        'redcap_repeat_instrument': ['', ''],
        'redcap_repeat_instance': ['', ''],
        'gender': ['2', '1']
    }
    expected = pd.DataFrame(data=d)

    assert len(encoded_rows) == 2
    assert_frame_equal(encoded_rows, expected, check_dtype=False)



def test_serializer_with_repeatable_instrument():

    data_dictionary = [
        {
            "field_name": "patient_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "gender",
            "form_name": "demographics",
            "field_type": "radio",
            "choices": "1, female | 2, male | 3, unknown | 4, unspecified | 5, not reported"
        },
        {
            "field_name": "treatment_dx",
            "form_name": "treatment",
            "field_type": "text",
        },
        {
            "field_name": "treatment",
            "form_name": "treatment",
            "field_type": "radio",
            "choices": "1, chemotherapy | 2, immunotherapy"
        },
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': "",
        'record_autonumbering_enabled': 0,
        'next_record_name': 1,
        'repeatable_instruments': ['treatment'],
    }

    records = [
        {"patient_id": "123", "gender": "male", "treatment_dx": "2018-09-01", "treatment": "chemotherapy"},
        {"patient_id": "123", "gender": "male", "treatment_dx": "2019-09-01", "treatment": "immunotherapy"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    encoded_rows = serializer.encode_sheet(data_dictionary, project_info, records)

    d = {
        'patient_id': ['123', '123', '123'],
        'redcap_repeat_instrument': ['', 'treatment', 'treatment'],
        'redcap_repeat_instance': ['', 1, 2],
        'gender': ['2', '', ''],
        'treatment': ['', '1', '2'],
        'treatment_dx': ['', '2018-09-01', '2019-09-01']
    }
    expected = pd.DataFrame(data=d)

    assert len(encoded_rows) == 3
    assert_frame_equal(encoded_rows, expected, check_dtype=False, check_like=True)



def test_serializer_with_repeatable_instrument():

    data_dictionary = [
        {
            "field_name": "patient_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "gender",
            "form_name": "demographics",
            "field_type": "radio",
            "choices": "1, female | 2, male | 3, unknown | 4, unspecified | 5, not reported"
        },
        {
            "field_name": "treatment_dx",
            "form_name": "treatment",
            "field_type": "text",
        },
        {
            "field_name": "treatment",
            "form_name": "treatment",
            "field_type": "radio",
            "choices": "1, chemotherapy | 2, immunotherapy"
        },
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': "",
        'record_autonumbering_enabled': 0,
        'next_record_name': 1,
        'repeatable_instruments': ['treatment'],
    }

    records = [
        {"patient_id": "123", "gender": "male", "treatment_dx": "2018-09-01", "treatment": "chemotherapy"},
        {"patient_id": "123", "gender": "male", "treatment_dx": "2019-09-01", "treatment": "immunotherapy"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    encoded_rows = serializer.encode_sheet(data_dictionary, project_info, records)

    d = {
        'patient_id': ['123', '123', '123'],
        'redcap_repeat_instrument': ['', 'treatment', 'treatment'],
        'redcap_repeat_instance': ['', 1, 2],
        'gender': ['2', '', ''],
        'treatment': ['', '1', '2'],
        'treatment_dx': ['', '2018-09-01', '2019-09-01']
    }
    expected = pd.DataFrame(data=d)

    assert len(encoded_rows) == 3
    assert_frame_equal(encoded_rows, expected, check_dtype=False, check_like=True)


def test_serializer_with_repeatable_instrument_and_matching_repeat_instances():

    data_dictionary = [
        {
            "field_name": "patient_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "gender",
            "form_name": "demographics",
            "field_type": "radio",
            "choices": "1, female | 2, male | 3, unknown | 4, unspecified | 5, not reported"
        },
        {
            "field_name": "treatment_dx",
            "form_name": "treatment",
            "field_type": "text",
        },
        {
            "field_name": "treatment",
            "form_name": "treatment",
            "field_type": "radio",
            "choices": "1, chemotherapy | 2, immunotherapy"
        },
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': "",
        'record_autonumbering_enabled': 0,
        'next_record_name': 1,
        'repeatable_instruments': ['treatment'],
    }

    records = [
        {"patient_id": "123", "gender": "male", "treatment_dx": "2018-09-01", "treatment": "chemotherapy"},
        {"patient_id": "123", "gender": "male", "treatment_dx": "2019-09-01", "treatment": "immunotherapy"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    options = {
        'matching_repeat_instances': {
            '0': {
                'treatment': 7
            }
        }
    }
    encoded_rows = serializer.encode_sheet(data_dictionary, project_info, records, options)

    d = {
        'patient_id': ['123', '123', '123'],
        'redcap_repeat_instrument': ['', 'treatment', 'treatment'],
        'redcap_repeat_instance': ['', 7, 2],
        'gender': ['2', '', ''],
        'treatment': ['', '1', '2'],
        'treatment_dx': ['', '2018-09-01', '2019-09-01']
    }
    expected = pd.DataFrame(data=d)

    assert len(encoded_rows) == 3
    assert_frame_equal(encoded_rows, expected, check_dtype=False, check_like=True)


def test_serializer_with_repeatable_instrument_and_matching_record_id():

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "dmp_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "gender",
            "form_name": "demographics",
            "field_type": "radio",
            "choices": "1, female | 2, male | 3, unknown | 4, unspecified | 5, not reported"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': 'dmp_id',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"dmp_id": "5", "gender": "male"},
        {"dmp_id": "6", "gender": "male"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    options = {
        'matching_record_ids': {
            '1': 10
        }
    }
    encoded_rows = serializer.encode_sheet(data_dictionary, project_info, records, options)

    d = {
        'record_id': [1, 10],
        'redcap_repeat_instrument': ['', ''],
        'redcap_repeat_instance': ['', ''],
        'dmp_id': ['5', '6'],
        'gender': ['2', '2'],
    }
    expected = pd.DataFrame(data=d)

    assert len(encoded_rows) == 2
    assert_frame_equal(encoded_rows, expected, check_dtype=False, check_like=True)
