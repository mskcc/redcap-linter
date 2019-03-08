import {
  LOADING_START,
  POST_FORM_SUCCESS,
  POST_FORM_FAILURE,
  MATCH_FIELDS,
  HIGHLIGHT_COLUMNS,
  REMOVE_FIELD_MATCH,
  MATCH_CHOICES,
  REMOVE_CHOICE_MATCH,
  SAVE_FIELDS_SUCCESS,
  SAVE_FIELDS_FAILURE,
  NAVIGATE_TO_SUCCESS,
  NAVIGATE_TO_FAILURE,
  FILTER_TABLE,
  FILTER_ROW,
  RESOLVE_COLUMN_SUCCESS,
  RESOLVE_COLUMN_FAILURE,
  RESOLVE_ROW_SUCCESS,
  RESOLVE_ROW_FAILURE,
  CORRECT_VALUE_SUCCESS,
  CORRECT_VALUE_FAILURE,
  REMOVE_VALUE_MATCH,
  UPDATE_VALUE_SUCCESS,
  UPDATE_VALUE_FAILURE,
} from '../actions/RedcapLinterActions';

export default function (state = {}, action) {
  switch (action.type) {
    case LOADING_START: {
      return Object.assign({}, state, { loading: true });
    }
    case POST_FORM_SUCCESS: {
      const error = { error: '' };
      if (action.payload.data && action.payload.data.error) {
        error.error = action.payload.data.error;
      }
      return Object.assign({ loading: false, new: true, page: 'matchFields' }, action.payload.data, error);
    }
    case POST_FORM_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case SAVE_FIELDS_SUCCESS: {
      let nextPage = {};
      if (action.payload && action.payload.page) {
        const selectedColumns = [];
        nextPage = { page: action.payload.page, new: false, selectedColumns };
      }
      return Object.assign({}, state, { loading: false }, nextPage, action.payload.data);
    }
    case SAVE_FIELDS_FAILURE: {
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
    case NAVIGATE_TO_SUCCESS: {
      return Object.assign({}, state, action.payload);
    }
    case NAVIGATE_TO_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case HIGHLIGHT_COLUMNS: {
      return Object.assign({}, state, action.payload);
    }
    case RESOLVE_COLUMN_SUCCESS: {
      return Object.assign({}, state, { workingRow: '' }, action.payload.data);
    }
    case RESOLVE_COLUMN_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case RESOLVE_ROW_SUCCESS: {
      return Object.assign({}, state, { workingColumn: '' }, action.payload.data);
    }
    case RESOLVE_ROW_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case UPDATE_VALUE_SUCCESS: {
      const fieldToValueMap = Object.assign({}, state.fieldToValueMap) || {};
      if (!action.payload.value && fieldToValueMap.hasOwnProperty(action.payload.field)) {
        delete fieldToValueMap[action.payload.field];
      } else {
        fieldToValueMap[action.payload.field] = action.payload.value;
      }
      return Object.assign({}, state, { fieldToValueMap });
    }
    case UPDATE_VALUE_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case CORRECT_VALUE_SUCCESS: {
      const originalToCorrectedValueMap = state.originalToCorrectedValueMap || {};
      const {
        workingSheetName,
        workingColumn,
      } = state;
      originalToCorrectedValueMap[workingSheetName] = originalToCorrectedValueMap[workingSheetName] || {}
      originalToCorrectedValueMap[workingSheetName][workingColumn] = originalToCorrectedValueMap[workingSheetName][workingColumn] || {}
      originalToCorrectedValueMap[workingSheetName][workingColumn] = Object.assign(originalToCorrectedValueMap[workingSheetName][workingColumn], action.payload)
      const fieldErrors = state.fieldErrors || {};
      let textErrors = [];
      if (fieldErrors.textErrors) {
        textErrors = fieldErrors.textErrors.slice();
      }
      Object.keys(action.payload).forEach((originalValue) => {
        const idx = textErrors.indexOf(originalValue);
        if (idx !== -1) textErrors.splice(idx, 1);
      })
      fieldErrors.textErrors = textErrors;
      return Object.assign({}, state, { originalToCorrectedValueMap, fieldErrors, textErrors });
    }
    case MATCH_CHOICES: {
      let dataFieldToChoiceMap = state.dataFieldToChoiceMap || {};
      const {
        workingSheetName,
        workingColumn,
      } = state;
      const fieldErrors = state.fieldErrors || {};
      let unmatchedChoices = [];
      if (fieldErrors.unmatchedChoices) {
        unmatchedChoices = fieldErrors.unmatchedChoices.slice();
      }
      for (let i = 0; i < Object.keys(action.payload).length; i++) {
        const idx = unmatchedChoices.indexOf(Object.keys(action.payload)[i]);
        if (idx !== -1) unmatchedChoices.splice(idx, 1);
      }
      dataFieldToChoiceMap[workingSheetName] = dataFieldToChoiceMap[workingSheetName] || {}
      dataFieldToChoiceMap[workingSheetName][workingColumn] = dataFieldToChoiceMap[workingSheetName][workingColumn] || {}
      dataFieldToChoiceMap[workingSheetName][workingColumn] = Object.assign(dataFieldToChoiceMap[workingSheetName][workingColumn], action.payload)
      fieldErrors.unmatchedChoices = unmatchedChoices;
      return Object.assign({}, state, { dataFieldToChoiceMap, fieldErrors, unmatchedChoices });
    }
    case REMOVE_CHOICE_MATCH: {
      const dataFieldToChoiceMap = state.dataFieldToChoiceMap || {};
      const {
        workingSheetName,
        workingColumn,
      } = state;
      dataFieldToChoiceMap[workingSheetName] = dataFieldToChoiceMap[workingSheetName] || {}
      dataFieldToChoiceMap[workingSheetName][workingColumn] = dataFieldToChoiceMap[workingSheetName][workingColumn] || {}
      delete dataFieldToChoiceMap[workingSheetName][workingColumn][action.payload.dataField];
      const fieldErrors = state.fieldErrors || {};
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
      let redcapFieldToDataFieldMap = state.redcapFieldToDataFieldMap || {};
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      let unmatchedDataFields = [];
      if (state.unmatchedDataFields) {
        unmatchedDataFields = state.unmatchedDataFields.slice();
      }
      for (const redcapField in action.payload) {
        let idx = unmatchedRedcapFields.indexOf(redcapField);
        if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
        idx = unmatchedDataFields.indexOf(action.payload[redcapField]);
        if (idx !== -1) unmatchedDataFields.splice(idx, 1);
      }
      const noMatchData = redcapFieldToDataFieldMap[''] || [];
      if (action.payload['']) {
        noMatchData.push(action.payload[''])
      }
      redcapFieldToDataFieldMap = Object.assign(redcapFieldToDataFieldMap, action.payload)
      redcapFieldToDataFieldMap[''] = noMatchData;
      return Object.assign({}, state, { redcapFieldToDataFieldMap, unmatchedRedcapFields, unmatchedDataFields });
    }
    case REMOVE_FIELD_MATCH: {
      const redcapFieldToDataFieldMap = state.redcapFieldToDataFieldMap || {};
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      let unmatchedDataFields = [];
      if (state.unmatchedDataFields) {
        unmatchedDataFields = state.unmatchedDataFields.slice();
      }
      if (!unmatchedDataFields.includes(action.payload.dataField)) {
        unmatchedDataFields.unshift(action.payload.dataField);
      }
      if (action.payload.redcapField) {
        if (!unmatchedRedcapFields.includes(action.payload.redcapField)) {
          unmatchedRedcapFields.unshift(action.payload.redcapField);
        }
        delete redcapFieldToDataFieldMap[action.payload.redcapField];
      } else {
        const noMatchData = redcapFieldToDataFieldMap[action.payload.redcapField];
        const idx = noMatchData.indexOf(action.payload.dataField);
        if (idx !== -1) noMatchData.splice(idx, 1);
        redcapFieldToDataFieldMap[action.payload.redcapField] = noMatchData;
      }
      return Object.assign({}, state, { redcapFieldToDataFieldMap, unmatchedRedcapFields, unmatchedDataFields });
    }
    case REMOVE_VALUE_MATCH: {
      const originalToCorrectedValueMap = state.originalToCorrectedValueMap || {};
      const {
        workingSheetName,
        workingColumn,
      } = state;
      originalToCorrectedValueMap[workingSheetName] = originalToCorrectedValueMap[workingSheetName] || {}
      originalToCorrectedValueMap[workingSheetName][workingColumn] = originalToCorrectedValueMap[workingSheetName][workingColumn] || {}
      Object.keys(action.payload).forEach((originalValue) => {
        delete originalToCorrectedValueMap[workingSheetName][workingColumn][originalValue];
      });
      const fieldErrors = state.fieldErrors || {};
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
    default: {
      return state;
    }
  }
}
