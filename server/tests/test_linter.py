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
