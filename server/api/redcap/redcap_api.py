import requests
import yaml
import logging
from definitions import ROOT_DIR

class RedcapApi(object):

    def __init__(self, env, **kwargs):
        output_format = kwargs.get('format')
        if output_format is not None and output_format in ['csv', 'json']:
            self.format = output_format
        else:
            self.format = 'json'
        with open(ROOT_DIR + "/config/redcap.yml", 'r') as ymlfile:
            cfg = yaml.load(ymlfile)
            self.base_url = cfg[env]['redcap_base_url']

    def fetch_data_dictionary(self, token):
        payload = {
            'token': token,
            'content': 'metadata',
            'format': self.format,
            'returnFormat': self.format
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception("Failed to retrieve data dictionary. REDCap responded with status code {0}".format(r.status_code))
        return r.json()

    def fetch_repeatable_instruments(self, token):
        payload = {
            'token': token,
            'content': 'repeatingFormsEvents',
            'format': self.format,
            'returnFormat': self.format
        }
        r = requests.post(self.base_url, data=payload)
        logging.warning(r.text)
        if r.status_code != 200:
            raise Exception("Failed to retrieve repeatable instruments. REDCap responded with status code {0}".format(r.status_code))
        return r.json()

    def fetch_project_info(self, token):
        payload = {
            'token': token,
            'content': 'project',
            'format': self.format,
            'returnFormat': self.format
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception("Failed to retrieve project info. REDCap responded with status code {0}".format(r.status_code))
        return r.json()

    def import_records(self, token, records):
        payload = {
            'token': token,
            'content': 'record',
            'format': self.format,
            'type': 'flat',
            'overwriteBehavior': 'normal',
            'forceAutoNumber': 'false',
            'data': records.to_csv(),
            'returnContent': 'count',
            'returnFormat': self.format
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception("Failed to retrieve data dictionary. REDCap responded with status code {0}".format(r.status_code))
        return r.json()

    def export_records(self, token, records):
        payload = {
            'token': token,
            'content': 'record',
            'format': self.format,
            'type': 'flat',
            'rawOrLabel': 'raw',
            'rawOrLabelHeaders': 'raw',
            'exportCheckboxLabel': False,
            'exportSurveyFields': False,
            'exportDataAccessGroups': False,
            'returnFormat': self.format
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception("Failed to retrieve data dictionary. REDCap responded with status code {0}".format(r.status_code))
        return r.json()

    def generate_next_record_name(self, token):
        payload = {
            'token': token,
            'content': 'generateNextRecordName',
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception("Failed to generate next record name. REDCap responded with status code {0}".format(r.status_code))
        return r.json()
