import axios from 'axios';

export const POST_FORM = 'POST_FORM';
export const POST_FORM_SUCCESS = 'POST_FORM_SUCCESS';
export const POST_FORM_FAILURE = 'POST_FORM_FAILURE';

export const MATCH_FIELDS_SUCCESS = 'MATCH_FIELDS_SUCCESS';
export const MATCH_FIELDS_FAILURE = 'MATCH_FIELDS_FAILURE';

export const SAVE_FIELDS_SUCCESS = 'SAVE_FIELDS_SUCCESS';
export const SAVE_FIELDS_FAILURE = 'SAVE_FIELDS_FAILURE';

export const NAVIGATE_TO_SUCCESS = 'NAVIGATE_TO_SUCCESS';
export const NAVIGATE_TO_FAILURE = 'NAVIGATE_TO_FAILURE';


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

export function saveFieldsSuccess(payload) {
  return {
    type: SAVE_FIELDS_SUCCESS,
    payload,
  };
}

export function saveFieldsError(payload) {
  return {
    type: SAVE_FIELDS_FAILURE,
    payload,
  };
}


export function saveFields(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('jsonData', JSON.stringify(payload.jsonData));
    data.append('redcapFieldToDataFieldMap', JSON.stringify(payload.redcapFieldToDataFieldMap));
    data.append('projectInfo', JSON.stringify(payload.projectInfo));
    data.append('ddData', JSON.stringify(payload.ddData));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));

    const request = axios({
      method: 'POST',
      url: 'http://localhost:5000/save_fields',
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(saveFieldsSuccess(response)),
      err => dispatch(saveFieldsError(err)),
    );
  };
}

export function navigateToSuccess(payload) {
  return {
    type: NAVIGATE_TO_SUCCESS,
    payload,
  };
}

export function navigateToFailure(payload) {
  return {
    type: NAVIGATE_TO_FAILURE,
    payload,
  };
}

export function navigateTo(page) {
  return function action(dispatch) {
    const payload = {
      page,
    };
    if (!page) {
      return dispatch(navigateToFailure(payload));
    }
    return dispatch(navigateToSuccess(payload));
  };
}
