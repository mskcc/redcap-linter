import axios from 'axios';

export const LOADING_START = 'LOADING_START';

export const POST_FORM_SUCCESS = 'POST_FORM_SUCCESS';
export const POST_FORM_FAILURE = 'POST_FORM_FAILURE';

export const IMPORT_RECORDS_SUCCESS = 'IMPORT_RECORDS_SUCCESS';
export const IMPORT_RECORDS_FAILURE = 'IMPORT_RECORDS_FAILURE';

export const MATCH_FIELDS = 'MATCH_FIELDS';

export const HIGHLIGHT_COLUMNS = 'HIGHLIGHT_COLUMNS';

export const CHANGE_RECONCILIATION_COLUMNS = 'CHANGE_RECONCILIATION_COLUMNS';

export const REMOVE_FIELD_MATCH = 'REMOVE_FIELD_MATCH';

export const SAVE_FIELDS_SUCCESS = 'SAVE_FIELDS_SUCCESS';
export const SAVE_FIELDS_FAILURE = 'SAVE_FIELDS_FAILURE';

export const MATCH_CHOICES = 'MATCH_CHOICES';

export const MERGE_FIELD = 'MERGE_FIELD';

export const REMOVE_MERGE = 'REMOVE_MERGE';

export const REMOVE_CHOICE_MATCH = 'REMOVE_CHOICE_MATCH';

export const NAVIGATE_TO_SUCCESS = 'NAVIGATE_TO_SUCCESS';
export const NAVIGATE_TO_FAILURE = 'NAVIGATE_TO_FAILURE';

export const FILTER_TABLE = 'FILTER_TABLE';

export const FILTER_ROW = 'FILTER_ROW';

export const CORRECT_VALUE = 'CORRECT_VALUE';

export const REMOVE_VALUE_MATCH = 'REMOVE_VALUE_MATCH';

export const UPDATE_VALUE = 'UPDATE_VALUE';

export const CHANGE_REPEATABLE_INSTRUMENTS = 'CHANGE_REPEATABLE_INSTRUMENTS';

export const CHANGE_SECONDARY_UNIQUE_FIELD = 'CHANGE_SECONDARY_UNIQUE_FIELD';

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
    data.append('existingRecordsFile', form.existingRecordsFile);
    data.append('existingRecordsFileName', form.existingRecordsFileName);
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

export function importRecordsSuccess(results) {
  return {
    type: IMPORT_RECORDS_SUCCESS,
    payload: results,
  };
}

export function importRecordsError(error) {
  return {
    type: IMPORT_RECORDS_FAILURE,
    payload: error,
  };
}

export function importRecords(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('encodedRecords', JSON.stringify(payload.encodedRecords || []));
    data.append('token', JSON.stringify(payload.token || ''));
    data.append('env', JSON.stringify(payload.env || ''));

    // dispatch(loadingStart());

    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/import_records`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(importRecordsSuccess(response)),
      err => dispatch(importRecordsError(err)),
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

export function changeReconciliationColumnsSuccess(payload) {
  return {
    type: CHANGE_RECONCILIATION_COLUMNS,
    payload,
  };
}

export function changeReconciliationColumns(payload) {
  return function action(dispatch) {
    return dispatch(changeReconciliationColumnsSuccess(payload));
  };
}

export function removeFieldMatchSuccess(payload) {
  return {
    type: REMOVE_FIELD_MATCH,
    payload,
  };
}

export function removeFieldMatch(payload) {
  return function action(dispatch) {
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
    data.append('dataFieldToRedcapFieldMap', JSON.stringify(payload.dataFieldToRedcapFieldMap));
    data.append('matchedFieldMap', JSON.stringify(payload.matchedFieldMap));
    data.append('projectInfo', JSON.stringify(payload.projectInfo));
    data.append('existingRecords', JSON.stringify(payload.existingRecords));
    data.append('token', JSON.stringify(payload.token));
    data.append('env', JSON.stringify(payload.env));
    data.append('recordidField', JSON.stringify(payload.recordidField));
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append('ddData', JSON.stringify(payload.ddData));
    data.append('dateColumns', JSON.stringify(payload.dateColumns));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));
    data.append('action', JSON.stringify(payload.action || ''));
    let nextPage = {};
    if (payload.action === 'continue') {
      nextPage = { page: 'lint' };
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

export function matchChoices(payload) {
  return function action(dispatch) {
    return dispatch(matchChoicesSuccess(payload));
  };
}

export function mergeFieldSuccess(payload) {
  return {
    type: MERGE_FIELD,
    payload,
  };
}

export function mergeField(payload) {
  return function action(dispatch) {
    return dispatch(mergeFieldSuccess(payload));
  };
}

export function removeMergeSuccess(payload) {
  return {
    type: REMOVE_MERGE,
    payload,
  };
}

export function removeMerge(payload) {
  return function action(dispatch) {
    return dispatch(removeMergeSuccess(payload));
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

export function removeValueMatch(payload) {
  return function action(dispatch) {
    return dispatch(removeValueMatchSuccess(payload));
  };
}

// TODO make this one call
export function correctValueSuccess(payload) {
  return {
    type: CORRECT_VALUE,
    payload,
  };
}

export function correctValue(payload) {
  return function action(dispatch) {
    return dispatch(correctValueSuccess(payload));
  };
}

export function updateValueSuccess(payload) {
  return {
    type: UPDATE_VALUE,
    payload,
  };
}

export function updateValue(payload) {
  return function action(dispatch) {
    return dispatch(updateValueSuccess(payload));
  };
}

export function changeRepeatableInstrumentsSuccess(payload) {
  return {
    type: CHANGE_REPEATABLE_INSTRUMENTS,
    payload,
  };
}

export function changeRepeatableInstruments(payload) {
  return function action(dispatch) {
    return dispatch(changeRepeatableInstrumentsSuccess(payload));
  };
}

export function changeSecondaryUniqueFieldSuccess(payload) {
  return {
    type: CHANGE_SECONDARY_UNIQUE_FIELD,
    payload,
  };
}

export function changeSecondaryUniqueField(payload) {
  return function action(dispatch) {
    return dispatch(changeSecondaryUniqueFieldSuccess(payload));
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
