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

def test_resolve_column_with_choice_map(client):
    """Test resolve column with choice map"""

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

    assert response.status_code == 200
    assert response.json['jsonData'] == json.loads('{"Demographics": [{"gender": "male"}, {"gender": "female"}]}')


def test_resolve_column_with_value_map(client):
    """Test resolve column with value map"""

    payload = {
        "jsonData": json.dumps({
            "Test": [
                {"volume": "2.5"},
                {"volume": "3.5"}
            ]
        }),
        "csvHeaders": json.dumps({
            "Test": ["volume"]
        }),
        "workingSheetName": json.dumps("Test"),
        "workingColumn": json.dumps("volume"),
        "originalToCorrectedValueMap": json.dumps({
            "Test": {
                "volume": {
                    "2.5": "3",
                    "3.5": "4"
                }
            }
        }),
        "ddData": json.dumps([
            {
                "field_name": "record_id",
                "form_name": "test",
                "field_type": "text"
            },
            {
                "field_name": "volume",
                "form_name": "test",
                "field_type": "text",
                "text_validation": "integer"
            }
        ]),
        "projectInfo": json.dumps({
            'secondary_unique_field': "",
            'record_autonumbering_enabled': 1,
            'next_record_name': 1
        })
    }

    response = client.post('/resolve_column', data=payload, content_type='multipart/form-data')

    assert response.status_code == 200
    assert response.json['jsonData'] == json.loads('{"Test": [{"volume": "3"}, {"volume": "4"}]}')



def test_resolve_merge(client):
    """Test resolve column with value map"""

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
        "workingMergeRow": json.dumps(0),
        "mergeMap": json.dumps({
            "Demographics": {
                "0": {
                    "gender": "male",
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

    response = client.post('/resolve_merge_row', data=payload, content_type='multipart/form-data')

    assert response.status_code == 200
    assert response.json['jsonData'] == json.loads('{"Demographics": [{"gender": "male"}, {"gender": "F"}]}')
