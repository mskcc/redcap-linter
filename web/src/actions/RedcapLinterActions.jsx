import axios from 'axios';

export const POST_FORM = 'POST_FORM';
export const POST_FORM_SUCCESS = 'POST_FORM_SUCCESS';
export const POST_FORM_FAILURE = 'POST_FORM_FAILURE';

export const MATCH_FIELDS_SUCCESS = 'MATCH_FIELDS_SUCCESS';
export const MATCH_FIELDS_FAILURE = 'MATCH_FIELDS_FAILURE';

export const DOWNLOAD_PROGRESS_SUCCESS = 'DOWNLOAD_PROGRESS_SUCCESS';
export const DOWNLOAD_PROGRESS_FAILURE = 'DOWNLOAD_PROGRESS_FAILURE';


export function postFormSuccess(results) {
  return {
    type: POST_FORM_SUCCESS,
    payload: results,
  };
}

export function postFormError(error) {
  return {
    type: POST_FORM_FAILURE,
    payload: error,
  };
}

export function postForm(form) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('dataFile', form.dataFile);
    data.append('dataFileName', form.dataFileName);
    data.append('token', form.token);
    data.append('environment', form.environment);
    data.append('dataDictionary', form.dataDictionary);
    data.append('dataDictionaryName', form.dataDictionaryName);
    data.append('repeatableInstruments', form.repeatableInstruments);

    const request = axios({
      method: 'POST',
      url: 'http://localhost:5000/',
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(postFormSuccess(response)),
      err => dispatch(postFormError(err)),
    );
  };
}

export function matchFieldsSuccess(payload) {
  return {
    type: MATCH_FIELDS_SUCCESS,
    payload,
  };
}

export function matchFieldsFailure(payload) {
  return {
    type: MATCH_FIELDS_FAILURE,
    payload,
  };
}

export function matchFields(redcapField, dataField) {
  return function action(dispatch) {
    const payload = {
      redcapField,
      dataField,
    };
    if (!dataField) {
      return dispatch(matchFieldsFailure(payload));
    }
    return dispatch(matchFieldsSuccess(payload));
  };
}

export function downloadProgressSuccess(payload) {
  return {
    type: DOWNLOAD_PROGRESS_SUCCESS,
    payload,
  };
}

export function downloadProgressError(payload) {
  return {
    type: DOWNLOAD_PROGRESS_FAILURE,
    payload,
  };
}


export function downloadProgress(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('jsonData', JSON.stringify(payload.jsonData));
    data.append('redcapFieldToDataFieldMap', payload.redcapFieldToDataFieldMap);
    data.append('dataFileName', payload.dataFileName);

    const request = axios({
      method: 'POST',
      url: 'http://localhost:5000/download_progress',
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(downloadProgressSuccess(response)),
      err => dispatch(downloadProgressError(err)),
    );
  };
}
