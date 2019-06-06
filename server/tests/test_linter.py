import os
import tempfile

import sys, os
path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, path + '/../')

import pytest

from app import app

@pytest.fixture
def client():
    db_fd, app.config['DATABASE'] = tempfile.mkstemp()
    app.config['TESTING'] = True
    client = app.test_client()


def test_empty_db(client):
    """Start with a blank database."""

    # rv = client.get('/')
    assert 1 + 1 == 2

def test_failure(client):
    """Start with a blank database."""

    # rv = client.get('/')
    assert 1 + 1 == 3
