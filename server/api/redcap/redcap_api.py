import requests
import yaml
import json
import logging
from definitions import ROOT_DIR


class RedcapApi(object):
    def __init__(self, env, **kwargs):
        output_format = kwargs.get("format")
        if output_format is not None and output_format in ["csv", "json"]:
            self.format = output_format
        else:
            self.format = "json"
        with open(ROOT_DIR + "/config/redcap.yml", "r") as ymlfile:
            cfg = yaml.load(ymlfile)
            self.base_url = cfg[env]["redcap_base_url"]

    def fetch_data_dictionary(self, token):
        payload = {
            "token": token,
            "content": "metadata",
            "format": self.format,
            "returnFormat": self.format,
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception(
                "Failed to retrieve data dictionary. REDCap responded with status code {0}".format(
                    r.status_code
                )
            )
        return r.json()

    def fetch_repeatable_instruments(self, token):
        payload = {
            "token": token,
            "content": "repeatingFormsEvents",
            "format": self.format,
            "returnFormat": self.format,
        }
        r = requests.post(self.base_url, data=payload)
        logging.warning(r.text)
        if r.status_code != 200:
            raise Exception(
                "Failed to retrieve repeatable instruments. REDCap responded with status code {0}".format(
                    r.status_code
                )
            )
        return r.json()

    def fetch_project_info(self, token):
        payload = {
            "token": token,
            "content": "project",
            "format": self.format,
            "returnFormat": self.format,
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception(
                "Failed to retrieve project info. REDCap responded with status code {0}".format(
                    r.status_code
                )
            )
        return r.json()

    def import_records(self, token, records):
        logging.warning(records)
        payload = {
            "token": token,
            "content": "record",
            "format": self.format,
            "type": "flat",
            "overwriteBehavior": "overwrite",
            "forceAutoNumber": "false",
            "data": json.dumps(records),
            "dateFormat": "MDY",
            "returnContent": "count",
            "returnFormat": self.format,
        }
        r = requests.post(self.base_url, data=payload)
        if r.status_code not in [200, 400]:
            raise Exception(
                "REDCap responded with status code {0}: {1}".format(
                    r.status_code, r.text
                )
            )
        return r.json()

    # filterLogic
    def export_records(self, token, options = {}):
        payload = {
            "token": token,
            "content": "record",
            "format": self.format,
            "type": "flat",
            "rawOrLabel": "raw",
            "rawOrLabelHeaders": "raw",
            "exportCheckboxLabel": False,
            "exportSurveyFields": False,
            "exportDataAccessGroups": False,
            "returnFormat": self.format,
        }
        if options.get('fields'):
            for i, field in enumerate(options.get('fields')):
                payload["fields[{0}]".format(i)] = field
        if options.get('records'):
            for i, record in enumerate(options.get('records')):
                payload["records[{0}]".format(i)] = record
        if options.get('forms'):
            for i, form in enumerate(options.get('forms')):
                payload["forms[{0}]".format(i)] = form
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception(
                "REDCap responded with status code {0}: {1}".format(
                    r.status_code, r.text
                )
            )
        return r.json()

    def generate_next_record_name(self, token):
        payload = {"token": token, "content": "generateNextRecordName"}
        r = requests.post(self.base_url, data=payload)
        if r.status_code != 200:
            raise Exception(
                "Failed to generate next record name. REDCap responded with status code {0}".format(
                    r.status_code
                )
            )
        return r.json()
