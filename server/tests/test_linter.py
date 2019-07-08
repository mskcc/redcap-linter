import pytest
import os
import json

import logging

import sys
path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, path + '/../')

from app import app
from utils import utils

@pytest.fixture
def client():
    app.config['TESTING'] = True
    client = app.test_client()

    yield client

def test_parameterize():
    str1 = "abc123"

    assert utils.parameterize(str1) == "abc123"

def test_empty_payload(client):
    """Test empty payload"""

    response = client.post('/')
    assert response.status_code == 400


def test_resolve_column_with_choice_map(client):
    """Test resolve column"""

    payload = {
        "jsonData": json.dumps({
            "Demographics": [
                {"gender": "M"},
                {"gender": "F"}
            ]
        }),
        "csvHeaders": json.dumps({
            "Demographics": ["gender"]
        }),
        "workingSheetName": json.dumps("Demographics"),
        "workingColumn": json.dumps("gender"),
        "dataFieldToChoiceMap": json.dumps({
            "Demographics": {
                "gender": {
                    "M": "male",
                    "F": "female"
                }
            }
        }),
        "ddData": json.dumps([
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
        ]),
        "projectInfo": json.dumps({
            'secondary_unique_field': "",
            'record_autonumbering_enabled': 1,
            'next_record_name': 1
        })
    }

    response = client.post('/resolve_column', data=payload, content_type='multipart/form-data')

    assert response.json['jsonData'] == json.loads('{"Demographics": [{"gender": "male"}, {"gender": "female"}]}')

    assert response.status_code == 200
