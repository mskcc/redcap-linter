import _ from 'lodash';
import {
  LOADING_START,
  DOWNLOAD_START,
  DOWNLOAD_FINISH,
  POST_FORM_SUCCESS,
  POST_FORM_FAILURE,
  MATCH_FIELDS,
  HIGHLIGHT_COLUMNS,
  HIGHLIGHT_CHOICES,
  CHANGE_RECONCILIATION_COLUMNS,
  REMOVE_FIELD_MATCH,
  MATCH_CHOICES,
  MERGE_FIELD,
  REMOVE_CHOICE_MATCH,
  REMOVE_MERGE,
  SAVE_FIELDS_SUCCESS,
  SAVE_FIELDS_FAILURE,
  ENCODE_RECORDS_START,
  ENCODE_RECORDS_SUCCESS,
  ENCODE_RECORDS_FAILURE,
  IMPORT_RECORDS_SUCCESS,
  IMPORT_RECORDS_FAILURE,
  NAVIGATE_TO_SUCCESS,
  NAVIGATE_TO_FAILURE,
  FILTER_TABLE,
  FILTER_ROW,
  ACCEPT_CORRECTIONS,
  CORRECT_VALUE,
  REMOVE_VALUE_MATCH,
  ACCEPT_ROW_MATCHES,
  UPDATE_VALUE,
  REMOVE_ROW_MATCH,
  CHANGE_REPEATABLE_INSTRUMENTS,
  CHANGE_SECONDARY_UNIQUE_FIELD,
} from '../actions/REDCapLinterActions';

import {
  LOADING_RESOLVE_START,
  RESOLVE_COLUMN_SUCCESS,
  RESOLVE_COLUMN_FAILURE,
  RESOLVE_ROW_SUCCESS,
  RESOLVE_ROW_FAILURE,
  RESOLVE_MERGE_ROW_SUCCESS,
  RESOLVE_MERGE_ROW_FAILURE,
  CALCULATE_MERGE_CONFLICTS_SUCCESS,
  CALCULATE_MERGE_CONFLICTS_FAILURE,
} from '../actions/ResolveActions';

export default function (state = {}, action) {
  switch (action.type) {
    case LOADING_START: {
      return Object.assign({}, state, { loading: true });
    }
    case LOADING_RESOLVE_START: {
      return Object.assign({}, state, { loadingResolve: true });
    }
    case DOWNLOAD_START: {
      return Object.assign({}, state, { formSubmitting: true });
    }
    case DOWNLOAD_FINISH: {
      return Object.assign({}, state, { formSubmitting: false });
    }
    case POST_FORM_SUCCESS: {
      const {
        payload: {
          data: { error },
        },
      } = action;
      let page = 'matchFields';
      if (error) {
        page = 'intro';
      }
      return Object.assign({ loading: false, new: true, page }, action.payload.data, error);
    }
    case POST_FORM_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case SAVE_FIELDS_SUCCESS: {
      let nextPage = {};
      if (action.payload && action.payload.page) {
        nextPage = { page: action.payload.page, new: false };
      }
      return Object.assign(
        {},
        state,
        { loading: false, fieldsSaved: true },
        nextPage,
        action.payload.data,
      );
    }
    case SAVE_FIELDS_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case ENCODE_RECORDS_START: {
      return Object.assign({}, state, { loading: true, page: 'finish' });
    }
    case ENCODE_RECORDS_SUCCESS: {
      return Object.assign({}, state, { loading: false }, action.payload.data);
    }
    case ENCODE_RECORDS_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case FILTER_TABLE: {
      return Object.assign({}, state, action.payload);
    }
    case FILTER_ROW: {
      return Object.assign({}, state, action.payload);
    }
    case IMPORT_RECORDS_SUCCESS: {
      return Object.assign({}, state, action.payload.data);
    }
    case IMPORT_RECORDS_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case NAVIGATE_TO_SUCCESS: {
      return Object.assign({}, state, action.payload);
    }
    case NAVIGATE_TO_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case HIGHLIGHT_COLUMNS: {
      let { matchedFieldMap = {} } = state;
      const { toggle = false } = state;
      matchedFieldMap = _.merge(matchedFieldMap, action.payload.matchedFieldMap);
      return Object.assign({}, state, { matchedFieldMap, toggle: !toggle });
    }
    case HIGHLIGHT_CHOICES: {
      let { matchedChoiceMap = {} } = state;
      const { toggle = false } = state;
      matchedChoiceMap = _.merge(matchedChoiceMap, action.payload.matchedChoiceMap);
      return Object.assign({}, state, { matchedChoiceMap, toggle: !toggle });
    }
    case CHANGE_RECONCILIATION_COLUMNS: {
      const { reconciliationColumns = {}, toggle = false } = state;
      reconciliationColumns[action.payload.instrument] = action.payload.reconciliationColumns;
      return Object.assign({}, state, {
        toggle: !toggle,
        reconciliationColumns,
      });
    }
    case RESOLVE_COLUMN_SUCCESS: {
      return Object.assign(
        {},
        state,
        { workingRow: -1, workingMergeRow: -1, loadingResolve: false },
        action.payload.data,
      );
    }
    case RESOLVE_COLUMN_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case RESOLVE_ROW_SUCCESS: {
      return Object.assign(
        {},
        state,
        { workingColumn: '', workingMergeRow: -1, loadingResolve: false },
        action.payload.data,
      );
    }
    case RESOLVE_ROW_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case RESOLVE_MERGE_ROW_SUCCESS: {
      return Object.assign({}, state, { workingColumn: '', workingRow: -1 }, action.payload.data);
    }
    case RESOLVE_MERGE_ROW_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case CALCULATE_MERGE_CONFLICTS_SUCCESS: {
      return Object.assign(
        {},
        state,
        { workingColumn: '', workingRow: -1, calculatedMergeConflicts: true },
        action.payload.data,
      );
    }
    case CALCULATE_MERGE_CONFLICTS_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case ACCEPT_ROW_MATCHES: {
      const {
        workingSheetName, workingRow, fieldToValueMap = {}, toggle = false,
      } = state;

      const matchedRowValueMap = action.payload.matchedRowValueMap;
      let unsavedValueMap = {};
      const fields = action.payload.fields || [];
      if (fields.length > 0) {
        fields.forEach((field) => {
          unsavedValueMap[field] = matchedRowValueMap[workingSheetName][workingRow][field];
          delete matchedRowValueMap[workingSheetName][workingRow][field];
        });
      } else {
        unsavedValueMap = matchedRowValueMap[workingSheetName][workingRow];
        matchedRowValueMap[workingSheetName][workingRow] = {};
      }
      fieldToValueMap[workingSheetName] = fieldToValueMap[workingSheetName] || {};
      fieldToValueMap[workingSheetName][workingRow] = fieldToValueMap[workingSheetName][workingRow] || {};
      fieldToValueMap[workingSheetName][workingRow] = Object.assign(
        fieldToValueMap[workingSheetName][workingRow],
        unsavedValueMap,
      );
      return Object.assign({}, state, { fieldToValueMap, matchedRowValueMap, toggle: !toggle });
    }
    case UPDATE_VALUE: {
      const { matchedRowValueMap = {}, workingSheetName, workingRow } = state;
      const { toggle = false } = state;
      matchedRowValueMap[workingSheetName] = matchedRowValueMap[workingSheetName] || {};
      matchedRowValueMap[workingSheetName][workingRow] = matchedRowValueMap[workingSheetName][workingRow] || {};
      const newRowMap = _.extend(
        {},
        matchedRowValueMap[workingSheetName][workingRow],
        action.payload.matchedRowValueMap[workingSheetName][workingRow],
      );
      matchedRowValueMap[workingSheetName][workingRow] = newRowMap;
      return Object.assign({}, state, { matchedRowValueMap, toggle: !toggle });
    }
    case CHANGE_REPEATABLE_INSTRUMENTS: {
      const projectInfo = state.projectInfo || {};
      const toggle = state.toggle || false;
      projectInfo.repeatable_instruments = action.payload.repeatableInstruments;
      return Object.assign({}, state, { projectInfo, toggle: !toggle });
    }
    case CHANGE_SECONDARY_UNIQUE_FIELD: {
      const projectInfo = state.projectInfo || {};
      const toggle = state.toggle || false;
      projectInfo.secondary_unique_field = action.payload.secondaryUniqueField;
      return Object.assign({}, state, { projectInfo, toggle: !toggle });
    }
    case ACCEPT_CORRECTIONS: {
      const {
        workingSheetName,
        workingColumn,
        originalToCorrectedValueMap = {},
        fieldErrors = {},
      } = state;
      const matchedValueMap = action.payload.matchedValueMap;
      const fields = action.payload.fields || [];
      let unsavedValueMap = {};
      if (fields.length > 0) {
        fields.forEach((field) => {
          unsavedValueMap[field] = matchedValueMap[workingSheetName][workingColumn][field];
          delete matchedValueMap[workingSheetName][workingColumn][field];
        });
      } else {
        unsavedValueMap = matchedValueMap[workingSheetName][workingColumn];
        matchedValueMap[workingSheetName][workingColumn] = {};
      }
      originalToCorrectedValueMap[workingSheetName] = originalToCorrectedValueMap[workingSheetName] || {};
      originalToCorrectedValueMap[workingSheetName][workingColumn] = originalToCorrectedValueMap[workingSheetName][workingColumn] || {};
      originalToCorrectedValueMap[workingSheetName][workingColumn] = Object.assign(
        originalToCorrectedValueMap[workingSheetName][workingColumn],
        unsavedValueMap,
      );
      let textErrors = [];
      if (fieldErrors.textErrors) {
        textErrors = fieldErrors.textErrors.slice();
      }
      Object.keys(action.payload).forEach((originalValue) => {
        const idx = textErrors.indexOf(originalValue);
        if (idx !== -1) textErrors.splice(idx, 1);
      });
      fieldErrors.textErrors = textErrors;
      return Object.assign({}, state, {
        originalToCorrectedValueMap,
        matchedValueMap,
        fieldErrors,
        textErrors,
      });
    }
    case CORRECT_VALUE: {
      const { matchedValueMap = {}, workingSheetName, workingColumn } = state;
      const { toggle = false } = state;
      matchedValueMap[workingSheetName] = matchedValueMap[workingSheetName] || {};
      matchedValueMap[workingSheetName][workingColumn] = matchedValueMap[workingSheetName][workingColumn] || {};
      const newRowMap = _.extend(
        {},
        matchedValueMap[workingSheetName][workingColumn],
        action.payload.matchedValueMap[workingSheetName][workingColumn],
      );
      matchedValueMap[workingSheetName][workingColumn] = newRowMap;
      return Object.assign({}, state, { matchedValueMap, toggle: !toggle });
    }
    case MERGE_FIELD: {
      const {
        workingSheetName, workingMergeRow, mergeMap = {}, toggle = false,
      } = state;
      mergeMap[workingSheetName] = mergeMap[workingSheetName] || {};
      mergeMap[workingSheetName][workingMergeRow] = mergeMap[workingSheetName][workingMergeRow] || {};
      mergeMap[workingSheetName][workingMergeRow] = Object.assign(
        mergeMap[workingSheetName][workingMergeRow],
        action.payload,
      );
      return Object.assign({}, state, { mergeMap, toggle: !toggle });
    }
    case REMOVE_MERGE: {
      const {
        workingSheetName, workingMergeRow, mergeMap = {}, toggle = false,
      } = state;
      mergeMap[workingSheetName] = mergeMap[workingSheetName] || {};
      mergeMap[workingSheetName][workingMergeRow] = mergeMap[workingSheetName][workingMergeRow] || {};
      delete mergeMap[workingSheetName][workingMergeRow][action.payload.field];
      return Object.assign({}, state, { mergeMap, toggle: !toggle });
    }
    case MATCH_CHOICES: {
      const {
        workingSheetName,
        workingColumn,
        dataFieldToChoiceMap = {},
        fieldErrors = {},
      } = state;
      let unmatchedChoices = [];
      if (fieldErrors.unmatchedChoices) {
        unmatchedChoices = fieldErrors.unmatchedChoices.slice();
      }
      const matchedChoiceMap = action.payload.matchedChoiceMap;
      let unsavedChoiceMap = {};
      const fields = action.payload.fields || [];
      if (fields.length > 0) {
        fields.forEach((field) => {
          unsavedChoiceMap[field] = matchedChoiceMap[workingSheetName][workingColumn][field];
          delete matchedChoiceMap[workingSheetName][workingColumn][field];
        });
      } else {
        unsavedChoiceMap = matchedChoiceMap[workingSheetName][workingColumn];
        matchedChoiceMap[workingSheetName][workingColumn] = {};
      }
      for (let i = 0; i < Object.keys(unsavedChoiceMap).length; i++) {
        const idx = unmatchedChoices.indexOf(Object.keys(unsavedChoiceMap)[i]);
        if (idx !== -1) unmatchedChoices.splice(idx, 1);
      }
      dataFieldToChoiceMap[workingSheetName] = dataFieldToChoiceMap[workingSheetName] || {};
      dataFieldToChoiceMap[workingSheetName][workingColumn] = dataFieldToChoiceMap[workingSheetName][workingColumn] || {};
      dataFieldToChoiceMap[workingSheetName][workingColumn] = Object.assign(
        dataFieldToChoiceMap[workingSheetName][workingColumn],
        unsavedChoiceMap,
      );
      fieldErrors.unmatchedChoices = unmatchedChoices;
      return Object.assign({}, state, {
        dataFieldToChoiceMap,
        fieldErrors,
        unmatchedChoices,
        matchedChoiceMap,
      });
    }
    case REMOVE_CHOICE_MATCH: {
      const {
        workingSheetName,
        workingColumn,
        dataFieldToChoiceMap = {},
        fieldErrors = {},
      } = state;
      dataFieldToChoiceMap[workingSheetName] = dataFieldToChoiceMap[workingSheetName] || {};
      dataFieldToChoiceMap[workingSheetName][workingColumn] = dataFieldToChoiceMap[workingSheetName][workingColumn] || {};
      delete dataFieldToChoiceMap[workingSheetName][workingColumn][action.payload.dataField];
      let unmatchedChoices = [];
      if (fieldErrors.unmatchedChoices) {
        unmatchedChoices = fieldErrors.unmatchedChoices.slice();
      }
      if (!unmatchedChoices.includes(action.payload.dataField)) {
        unmatchedChoices.unshift(action.payload.dataField);
      }
      fieldErrors.unmatchedChoices = unmatchedChoices;
      return Object.assign({}, state, { dataFieldToChoiceMap, fieldErrors, unmatchedChoices });
    }
    case MATCH_FIELDS: {
      let { noMatchRedcapFields = [], dataFieldToRedcapFieldMap = {} } = state;
      const { unmatchedDataFields } = state;
      noMatchRedcapFields = _.union(noMatchRedcapFields, action.payload.noMatchRedcapFields);
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      Object.keys(action.payload.dataFieldToRedcapFieldMap).forEach((sheet) => {
        if (state.unmatchedDataFields[sheet]) {
          unmatchedDataFields[sheet] = state.unmatchedDataFields[sheet].slice();
        }
        if (action.payload.dataFieldToRedcapFieldMap[sheet]) {
          Object.keys(action.payload.dataFieldToRedcapFieldMap[sheet]).forEach((dataField) => {
            let idx = unmatchedRedcapFields.indexOf(
              action.payload.dataFieldToRedcapFieldMap[sheet][dataField],
            );
            if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
            idx = unmatchedDataFields[sheet].indexOf(dataField);
            if (idx !== -1) unmatchedDataFields[sheet].splice(idx, 1);
          });
        }
      });

      if (action.payload.noMatchRedcapFields) {
        action.payload.noMatchRedcapFields.forEach((redcapField) => {
          const idx = unmatchedRedcapFields.indexOf(redcapField);
          if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
        });
      }

      dataFieldToRedcapFieldMap = _.merge(
        dataFieldToRedcapFieldMap,
        action.payload.dataFieldToRedcapFieldMap,
      );
      return Object.assign({}, state, {
        dataFieldToRedcapFieldMap,
        unmatchedRedcapFields,
        unmatchedDataFields,
        noMatchRedcapFields,
      });
    }
    case REMOVE_FIELD_MATCH: {
      const dataFieldToRedcapFieldMap = state.dataFieldToRedcapFieldMap || {};
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      let noMatchRedcapFields = [];
      if (state.noMatchRedcapFields) {
        noMatchRedcapFields = state.noMatchRedcapFields.slice();
      }
      const {
        payload: { sheet },
      } = action;
      const { unmatchedDataFields } = state;
      if (unmatchedDataFields[sheet]) {
        unmatchedDataFields[sheet] = unmatchedDataFields[sheet].slice();
        if (!unmatchedDataFields[sheet].includes(action.payload.dataField)) {
          unmatchedDataFields[sheet].unshift(action.payload.dataField);
        }
      }

      if (action.payload.redcapField) {
        if (!unmatchedRedcapFields.includes(action.payload.redcapField)) {
          unmatchedRedcapFields.unshift(action.payload.redcapField);
        }

        if (noMatchRedcapFields.includes(action.payload.redcapField)) {
          const idx = noMatchRedcapFields.indexOf(action.payload.redcapField);
          if (idx !== -1) noMatchRedcapFields.splice(idx, 1);
        }

        if (sheet) {
          delete dataFieldToRedcapFieldMap[sheet][action.payload.dataField];
        }
      }
      return Object.assign({}, state, {
        dataFieldToRedcapFieldMap,
        unmatchedRedcapFields,
        unmatchedDataFields,
        noMatchRedcapFields,
      });
    }
    case REMOVE_VALUE_MATCH: {
      const {
        workingSheetName,
        workingColumn,
        originalToCorrectedValueMap = {},
        fieldErrors = {},
      } = state;
      originalToCorrectedValueMap[workingSheetName] = originalToCorrectedValueMap[workingSheetName] || {};
      originalToCorrectedValueMap[workingSheetName][workingColumn] = originalToCorrectedValueMap[workingSheetName][workingColumn] || {};
      Object.keys(action.payload).forEach((originalValue) => {
        delete originalToCorrectedValueMap[workingSheetName][workingColumn][originalValue];
      });
      let textErrors = [];
      if (fieldErrors.textErrors) {
        textErrors = fieldErrors.textErrors.slice();
      }

      Object.keys(action.payload).forEach((originalValue) => {
        if (!textErrors.map(e => e.toString()).includes(originalValue.toString())) {
          textErrors.unshift(originalValue);
        }
      });
      fieldErrors.textErrors = textErrors;
      return Object.assign({}, state, { originalToCorrectedValueMap, fieldErrors, textErrors });
    }
    case REMOVE_ROW_MATCH: {
      const {
        workingSheetName, workingRow, fieldToValueMap = {}, toggle = false,
      } = state;
      fieldToValueMap[workingSheetName] = fieldToValueMap[workingSheetName] || {};
      fieldToValueMap[workingSheetName][workingRow] = fieldToValueMap[workingSheetName][workingRow] || {};
      Object.keys(action.payload).forEach((field) => {
        delete fieldToValueMap[workingSheetName][workingRow][field];
      });
      return Object.assign({}, state, { fieldToValueMap, toggle: !toggle });
    }
    default: {
      return state;
    }
  }
}
