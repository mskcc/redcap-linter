import axios from 'axios';

export const RESOLVE_COLUMN_SUCCESS = 'RESOLVE_COLUMN_SUCCESS';
export const RESOLVE_COLUMN_FAILURE = 'RESOLVE_COLUMN_FAILURE';

export const RESOLVE_ROW_SUCCESS = 'RESOLVE_ROW_SUCCESS';
export const RESOLVE_ROW_FAILURE = 'RESOLVE_ROW_FAILURE';

export const RESOLVE_MERGE_ROW_SUCCESS = 'RESOLVE_MERGE_ROW_SUCCESS';
export const RESOLVE_MERGE_ROW_FAILURE = 'RESOLVE_MERGE_ROW_FAILURE';

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
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append('nextColumn', payload.nextColumn ? JSON.stringify(payload.nextColumn) : '');
    data.append(
      'nextSheetName',
      payload.nextSheetName ? JSON.stringify(payload.nextSheetName) : '',
    );
    data.append(
      'workingColumn',
      payload.workingColumn ? JSON.stringify(payload.workingColumn) : '',
    );
    data.append(
      'workingSheetName',
      payload.workingSheetName ? JSON.stringify(payload.workingSheetName) : '',
    );
    data.append('columnsInError', JSON.stringify(payload.columnsInError));
    data.append('rowsInError', JSON.stringify(payload.rowsInError));
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
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append(
      'nextMergeRow',
      payload.nextMergeRow >= 0 ? JSON.stringify(payload.nextMergeRow) : '',
    );
    data.append(
      'nextSheetName',
      payload.nextSheetName ? JSON.stringify(payload.nextSheetName) : '',
    );
    data.append(
      'workingMergeRow',
      payload.workingMergeRow >= 0 ? JSON.stringify(payload.workingMergeRow) : '',
    );
    data.append(
      'workingSheetName',
      payload.workingSheetName ? JSON.stringify(payload.workingSheetName) : '',
    );
    data.append('mergeConflicts', JSON.stringify(payload.mergeConflicts));
    data.append('action', payload.action ? JSON.stringify(payload.action) : '');

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
    data.append('malformedSheets', JSON.stringify(payload.malformedSheets || []));
    data.append('nextRow', JSON.stringify(payload.nextRow || ''));
    data.append(
      'nextSheetName',
      payload.nextSheetName ? JSON.stringify(payload.nextSheetName) : '',
    );
    data.append('workingRow', payload.workingRow ? JSON.stringify(payload.workingRow) : '');
    data.append(
      'workingSheetName',
      payload.workingSheetName ? JSON.stringify(payload.workingSheetName) : '',
    );
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
