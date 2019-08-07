"""This module provides an interface to the REDCap api."""
import json
import logging

import requests

class RedcapApi():
    """This class is an interface to the REDCap api."""
    def __init__(self, env, **kwargs):
        output_format = kwargs.get("format")
        if output_format is not None and output_format in ["csv", "json"]:
            self.format = output_format
        else:
            self.format = "json"
        self.base_url = env

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
                "REDCap responded with status code {0}: {1}".format(
                    r.status_code, r.text
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
        if r.status_code != 200:
            raise Exception(
                "REDCap responded with status code {0}: {1}".format(
                    r.status_code, r.text
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
                "REDCap responded with status code {0}: {1}".format(
                    r.status_code, r.text
                )
            )
        return r.json()

    def import_records(self, token, records):
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
    def export_records(self, token, options={}):
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
        if options.get('secondary_unique_field'):
            filter_logic = ''
            for i, row_values in enumerate(options.get('secondary_unique_field_values')):
                filter_logic += "("
                for j, field in enumerate(options.get('secondary_unique_field', [])):
                    filter_logic += "[{0}] = '{1}'".format(field, row_values[j])
                    if j < len(options.get('secondary_unique_field', [])) - 1:
                        filter_logic += " AND "
                filter_logic += ")"
                if i < len(options.get('secondary_unique_field_values')) - 1:
                    filter_logic += " OR "
            payload["filterLogic"] = filter_logic
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
                "REDCap responded with status code {0}: {1}".format(
                    r.status_code, r.text
                )
            )
        return r.json()
