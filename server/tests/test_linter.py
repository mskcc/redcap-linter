import pytest
import os
import json

import logging

import sys
path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, path + '/../')

import pandas as pd

from app import app
from utils import utils
from linter import linter
from models.redcap_field import RedcapField

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

def test_validation_permissible_value_success(client):
    """Test date validation"""

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
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"gender": "male"},
        {"gender": "male"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 0

def test_validation_permissible_value_failure(client):
    """Test date validation"""

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
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"gender": "dog"},
        {"gender": "male"}
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 1
    assert "dog not found in Permissible Values" in results['all_errors'][0]

def test_date_validation_success(client):
    """Test date validation"""

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "treatment_dx",
            "form_name": "treatment",
            "field_type": "text",
            "text_validation": "date_mdy"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"treatment_dx": "2018-09-01"},
        {"treatment_dx": "2018/09/01"},
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 0

def test_date_validation_failure(client):
    """Test date validation"""

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "treatment_dx",
            "form_name": "treatment",
            "field_type": "text",
            "text_validation": "date_mdy"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"treatment_dx": "abcd"},
        {"treatment_dx": "05-05-2018"},
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 1

def test_integer_validation(client):
    """Test date validation"""

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "number",
            "form_name": "demographics",
            "field_type": "text",
            "text_validation": "integer"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"number": "1"},
        {"number": "2.5"},
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 1
    assert results['all_errors'][0] == "2.5 did not pass date validation integer. Min: None | Max: None"

def test_integer_validation_with_range(client):
    """Test date validation"""

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "number",
            "form_name": "demographics",
            "field_type": "text",
            "text_validation": "integer",
            "text_min": "1",
            "text_max": "5",
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"number": "1"},
        {"number": "6"},
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 1
    assert results['all_errors'][0] == "6 did not pass date validation integer. Min: 1 | Max: 5"

def test_decimal_validation(client):
    """Test date validation"""

    data_dictionary = [
        {
            "field_name": "record_id",
            "form_name": "demographics",
            "field_type": "text"
        },
        {
            "field_name": "number",
            "form_name": "demographics",
            "field_type": "text",
            "text_validation": "number_2dp"
        }
    ]

    data_dictionary = [RedcapField.from_json(field) for field in data_dictionary]

    project_info = {
        'secondary_unique_field': '',
        'record_autonumbering_enabled': 1,
        'next_record_name': 1,
        'repeatable_instruments': [],
    }

    records = [
        {"number": "1"},
        {"number": "2.55"},
    ]
    records = pd.DataFrame(records)
    records.fillna('', inplace=True)

    results = linter.lint_sheet(data_dictionary, project_info, records)

    assert len(results['all_errors']) == 1
    assert results['all_errors'][0] == "1 did not pass date validation number_2dp. Min: None | Max: None"
