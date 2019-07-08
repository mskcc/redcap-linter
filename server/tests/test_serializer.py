import pytest
import os
import json

import logging

import sys
path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, path + '/../')

import pandas as pd

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

    assert len(encoded_rows) == 2
