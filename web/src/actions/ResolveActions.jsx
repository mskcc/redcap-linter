import axios from 'axios';

export const RESOLVE_COLUMN_SUCCESS = 'RESOLVE_COLUMN_SUCCESS';
export const RESOLVE_COLUMN_FAILURE = 'RESOLVE_COLUMN_FAILURE';

export const RESOLVE_ROW_SUCCESS = 'RESOLVE_ROW_SUCCESS';
export const RESOLVE_ROW_FAILURE = 'RESOLVE_ROW_FAILURE';

export const RESOLVE_MERGE_ROW_SUCCESS = 'RESOLVE_MERGE_ROW_SUCCESS';
export const RESOLVE_MERGE_ROW_FAILURE = 'RESOLVE_MERGE_ROW_FAILURE';

export const CALCULATE_MERGE_CONFLICTS_SUCCESS = 'CALCULATE_MERGE_CONFLICTS_SUCCESS';
export const CALCULATE_MERGE_CONFLICTS_FAILURE = 'CALCULATE_MERGE_CONFLICTS_FAILURE';

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
    data.append(
      'originalToCorrectedValueMap',
      JSON.stringify(payload.originalToCorrectedValueMap || {}),
    );
    data.append('decodedRecords', JSON.stringify(payload.decodedRecords || {}));
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append('nextColumn', payload.nextColumn ? JSON.stringify(payload.nextColumn) : '');
    data.append('nextSheetName', JSON.stringify(payload.nextSheetName || ''));
    data.append(
      'workingColumn',
      payload.workingColumn ? JSON.stringify(payload.workingColumn) : '',
    );
    data.append('workingSheetName', JSON.stringify(payload.workingSheetName || ''));
    data.append('columnsInError', JSON.stringify(payload.columnsInError));
    data.append('rowsInError', JSON.stringify(payload.rowsInError));
    data.append('action', payload.action ? JSON.stringify(payload.action) : '');

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

export function resolveMergeRowSuccess(payload) {
  return {
    type: RESOLVE_MERGE_ROW_SUCCESS,
    payload,
  };
}

export function resolveMergeRowError(payload) {
  return {
    type: RESOLVE_MERGE_ROW_FAILURE,
    payload,
  };
}

export function resolveMergeRow(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('jsonData', JSON.stringify(payload.jsonData));
    data.append('projectInfo', JSON.stringify(payload.projectInfo));
    data.append('ddData', JSON.stringify(payload.ddData));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));
    data.append('mergeMap', JSON.stringify(payload.mergeMap || {}));
    data.append('decodedRecords', JSON.stringify(payload.decodedRecords || {}));
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append(
      'nextMergeRow',
      payload.nextMergeRow >= 0 ? JSON.stringify(payload.nextMergeRow) : '-1',
    );
    data.append('nextSheetName', JSON.stringify(payload.nextSheetName || ''));
    data.append(
      'workingMergeRow',
      payload.workingMergeRow >= 0 ? JSON.stringify(payload.workingMergeRow) : '-1',
    );
    data.append('workingSheetName', JSON.stringify(payload.workingSheetName || ''));
    data.append('mergeConflicts', JSON.stringify(payload.mergeConflicts));
    data.append('action', JSON.stringify(payload.action || ''));

    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/resolve_merge_row`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(resolveMergeRowSuccess(response)),
      err => dispatch(resolveMergeRowError(err)),
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
    data.append('decodedRecords', JSON.stringify(payload.decodedRecords || {}));
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append('nextRow', payload.nextRow >= 0 ? JSON.stringify(payload.nextRow) : '-1');
    data.append('nextSheetName', JSON.stringify(payload.nextSheetName || ''));
    data.append('workingRow', payload.workingRow >= 0 ? JSON.stringify(payload.workingRow) : '-1');
    data.append('workingSheetName', JSON.stringify(payload.workingSheetName || ''));
    data.append('columnsInError', JSON.stringify(payload.columnsInError));
    data.append('rowsInError', JSON.stringify(payload.rowsInError));
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

export function calculateMergeConflictsFailure(payload) {
  return {
    type: CALCULATE_MERGE_CONFLICTS_FAILURE,
    payload,
  };
}

export function calculateMergeConflictsSuccess(payload) {
  return {
    type: CALCULATE_MERGE_CONFLICTS_SUCCESS,
    payload,
  };
}

export function calculateMergeConflicts(payload) {
  return function action(dispatch) {
    const data = new FormData();
    data.append('jsonData', JSON.stringify(payload.jsonData));
    data.append('ddData', JSON.stringify(payload.ddData));
    data.append('projectInfo', JSON.stringify(payload.projectInfo));
    data.append('csvHeaders', JSON.stringify(payload.csvHeaders));
    data.append('existingRecords', JSON.stringify(payload.existingRecords));
    data.append('recordidField', JSON.stringify(payload.recordidField));
    data.append('decodedRecords', JSON.stringify(payload.decodedRecords || {}));
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets));
    data.append('mergeConflicts', JSON.stringify(payload.mergeConflicts || []));
    data.append('decodedRecords', JSON.stringify(payload.decodedRecords));
    data.append('reconciliationColumns', JSON.stringify(payload.reconciliationColumns));
    const request = axios({
      method: 'POST',
      url: `${process.env.REDCAP_LINTER_HOST}:${
        process.env.REDCAP_LINTER_PORT
      }/calculate_merge_conflicts`,
      headers: { 'Content-Type': 'multipart/form-data' },
      data,
    });

    return request.then(
      response => dispatch(calculateMergeConflictsSuccess(Object.assign({}, response))),
      err => dispatch(calculateMergeConflictsFailure(err)),
    );
  };
}
