import axios from 'axios';

export const LOADING_START = 'LOADING_START';

export const POST_FORM_SUCCESS = 'POST_FORM_SUCCESS';
export const POST_FORM_FAILURE = 'POST_FORM_FAILURE';

export const MATCH_FIELDS = 'MATCH_FIELDS';

export const HIGHLIGHT_COLUMNS = 'HIGHLIGHT_COLUMNS';

export const REMOVE_FIELD_MATCH = 'REMOVE_FIELD_MATCH';

export const SAVE_FIELDS_SUCCESS = 'SAVE_FIELDS_SUCCESS';
export const SAVE_FIELDS_FAILURE = 'SAVE_FIELDS_FAILURE';

export const MATCH_CHOICES = 'MATCH_CHOICES';

export const REMOVE_CHOICE_MATCH = 'REMOVE_CHOICE_MATCH';

export const NAVIGATE_TO_SUCCESS = 'NAVIGATE_TO_SUCCESS';
export const NAVIGATE_TO_FAILURE = 'NAVIGATE_TO_FAILURE';

export const FILTER_TABLE = 'FILTER_TABLE';

export const FILTER_ROW = 'FILTER_ROW';

export const RESOLVE_COLUMN_SUCCESS = 'RESOLVE_COLUMN_SUCCESS';
export const RESOLVE_COLUMN_FAILURE = 'RESOLVE_COLUMN_FAILURE';

export const RESOLVE_ROW_SUCCESS = 'RESOLVE_ROW_SUCCESS';
export const RESOLVE_ROW_FAILURE = 'RESOLVE_ROW_FAILURE';

export const CORRECT_VALUE_SUCCESS = 'CORRECT_VALUE_SUCCESS';
export const CORRECT_VALUE_FAILURE = 'CORRECT_VALUE_FAILURE';

export const REMOVE_VALUE_MATCH = 'REMOVE_VALUE_MATCH';

export const UPDATE_VALUE_SUCCESS = 'UPDATE_VALUE_SUCCESS';
export const UPDATE_VALUE_FAILURE = 'UPDATE_VALUE_FAILURE';


export function loadingStart() {
  return {
    type: LOADING_START,
  };
}

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
    data.append('mappingsFile', form.mappingsFile);
    data.append('mappingsFileName', form.mappingsFileName);
    data.append('token', form.token);
    data.append('environment', form.environment);
    data.append('dataDictionary', form.dataDictionary);
    data.append('dataDictionaryName', form.dataDictionaryName);
    data.append('repeatableInstruments', form.repeatableInstruments);

    dispatch(loadingStart());

    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/`,
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
    type: MATCH_FIELDS,
    payload,
  };
}

export function matchFields(payload) {
  return function action(dispatch) {
    return dispatch(matchFieldsSuccess(payload));
  };
}

export function highlightColumnsSuccess(payload) {
  return {
    type: HIGHLIGHT_COLUMNS,
    payload,
  };
}

export function highlightColumns(payload) {
  return function action(dispatch) {
    return dispatch(highlightColumnsSuccess(payload));
  };
}

export function removeFieldMatchSuccess(payload) {
  return {
    type: REMOVE_FIELD_MATCH,
    payload,
  };
}

export function removeFieldMatch(redcapField, dataField) {
  return function action(dispatch) {
    const payload = {
      redcapField,
      dataField,
    };
    return dispatch(removeFieldMatchSuccess(payload));
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
    data.append('dateColumns', JSON.stringify(payload.dateColumns));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));
    data.append('action', payload.action ? JSON.stringify(payload.action) : '');
    let nextPage = {};
    if (payload.action === 'continue') {
      nextPage = { page: 'lint' }
    }
    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/save_fields`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    dispatch(loadingStart());

    return request.then(
      response => dispatch(saveFieldsSuccess(Object.assign({}, nextPage, response))),
      err => dispatch(saveFieldsError(err)),
    );
  };
}

export function matchChoicesSuccess(payload) {
  return {
    type: MATCH_CHOICES,
    payload,
  };
}

export function matchChoices(dataFieldToChoiceMap) {
  return function action(dispatch) {
    const payload = dataFieldToChoiceMap;
    return dispatch(matchChoicesSuccess(payload));
  };
}

export function removeChoiceMatchSuccess(payload) {
  return {
    type: REMOVE_CHOICE_MATCH,
    payload,
  };
}

export function removeChoiceMatch(dataField, permissibleValue) {
  return function action(dispatch) {
    const payload = {
      dataField,
      permissibleValue,
    };
    return dispatch(removeChoiceMatchSuccess(payload));
  };
}


export function removeValueMatchSuccess(payload) {
  return {
    type: REMOVE_VALUE_MATCH,
    payload,
  };
}

export function removeValueMatch(originalValue, correctedValue) {
  return function action(dispatch) {
    const payload = {
      originalValue,
      correctedValue,
    };
    return dispatch(removeValueMatchSuccess(payload));
  };
}

// TODO make this one call
export function correctValueSuccess(payload) {
  return {
    type: CORRECT_VALUE_SUCCESS,
    payload,
  };
}

export function correctValueFailure(payload) {
  return {
    type: CORRECT_VALUE_FAILURE,
    payload,
  };
}

export function correctValue(originalValue, correctedValue) {
  return function action(dispatch) {
    const payload = {
      originalValue,
      correctedValue,
    };
    if (!originalValue) {
      return dispatch(correctValueFailure(payload));
    }
    return dispatch(correctValueSuccess(payload));
  };
}

export function updateValueSuccess(payload) {
  return {
    type: UPDATE_VALUE_SUCCESS,
    payload,
  };
}

export function updateValueFailure(payload) {
  return {
    type: UPDATE_VALUE_FAILURE,
    payload,
  };
}

export function updateValue(field, value) {
  return function action(dispatch) {
    const payload = {
      field,
      value,
    };
    return dispatch(updateValueSuccess(payload));
  };
}

export function navigateToSuccess(payload) {
  return {
    type: NAVIGATE_TO_SUCCESS,
    payload,
  };
}

export function navigateToError(payload) {
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
      return dispatch(navigateToError(payload));
    }
    return dispatch(navigateToSuccess(payload));
  };
}

export function filterTableSuccess(payload) {
  return {
    type: FILTER_TABLE,
    payload,
  };
}

export function filterTable(filter) {
  return function action(dispatch) {
    const payload = {
      filter,
    };
    return dispatch(filterTableSuccess(payload));
  };
}

export function filterRowSuccess(payload) {
  return {
    type: FILTER_ROW,
    payload,
  };
}

export function filterRow(sheet, rowNum) {
  return function action(dispatch) {
    const payload = {
      filterSheet: sheet,
      filterRowNum: rowNum,
    };
    return dispatch(filterRowSuccess(payload));
  };
}

export function resolveColumnSuccess(payload) {
  return {
    type: RESOLVE_COLUMN_SUCCESS,
    payload,
  };
}

export function resolveColumnError(payload) {
  return {
    type: RESOLVE_COLUMN_FAILURE,
    payload,
  };
}

export function resolveColumn(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('jsonData', JSON.stringify(payload.jsonData));
    data.append('projectInfo', JSON.stringify(payload.projectInfo));
    data.append('ddData', JSON.stringify(payload.ddData));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));
    data.append('dataFieldToChoiceMap', JSON.stringify(payload.dataFieldToChoiceMap || {}));
    data.append('originalToCorrectedValueMap', JSON.stringify(payload.originalToCorrectedValueMap || {}));
    data.append('nextColumn', payload.nextColumn ? JSON.stringify(payload.nextColumn) : '');
    data.append('nextSheetName', payload.nextSheetName ? JSON.stringify(payload.nextSheetName) : '');
    data.append('workingColumn', payload.workingColumn ? JSON.stringify(payload.workingColumn) : '');
    data.append('workingSheetName', payload.workingSheetName ? JSON.stringify(payload.workingSheetName) : '');
    data.append('columnsInError', JSON.stringify(payload.columnsInError));
    data.append('action', payload.action ? JSON.stringify(payload.action) : '');
    // data.append('sheetName', JSON.stringify(payload.sheetName));

    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/resolve_column`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(resolveColumnSuccess(response)),
      err => dispatch(resolveColumnError(err)),
    );
  };
}

export function resolveRowSuccess(payload) {
  return {
    type: RESOLVE_ROW_SUCCESS,
    payload,
  };
}

export function resolveRowError(payload) {
  return {
    type: RESOLVE_ROW_FAILURE,
    payload,
  };
}

export function resolveRow(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('jsonData', JSON.stringify(payload.jsonData));
    data.append('projectInfo', JSON.stringify(payload.projectInfo));
    data.append('ddData', JSON.stringify(payload.ddData));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));
    data.append('fieldToValueMap', JSON.stringify(payload.fieldToValueMap || {}));
    data.append('nextRow', JSON.stringify(payload.nextRow || 0));
    data.append('nextSheetName', payload.nextSheetName ? JSON.stringify(payload.nextSheetName) : '');
    data.append('workingRow', payload.workingRow ? JSON.stringify(payload.workingRow) : 0);
    data.append('workingSheetName', payload.workingSheetName ? JSON.stringify(payload.workingSheetName) : '');
    data.append('recordsMissingRequiredData', JSON.stringify(payload.recordsMissingRequiredData));
    data.append('action', payload.action ? JSON.stringify(payload.action) : '');

    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/resolve_row`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(resolveRowSuccess(response)),
      err => dispatch(resolveRowError(err)),
    );
  };
}
