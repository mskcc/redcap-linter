import _ from 'lodash';
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
  CORRECT_VALUE,
  REMOVE_VALUE_MATCH,
  UPDATE_VALUE,
} from '../actions/RedcapLinterActions';

export default function (state = {}, action) {
  switch (action.type) {
    case LOADING_START: {
      return Object.assign({}, state, { loading: true });
    }
    case POST_FORM_SUCCESS: {
      let error = '';
      if (action.payload.data && action.payload.data.error) {
        error = action.payload.data.error;
      }
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
    case UPDATE_VALUE: {
      const fieldToValueMap = Object.assign({}, state.fieldToValueMap) || {};
      const {
        workingSheetName,
        workingRow,
      } = state;
      fieldToValueMap[workingSheetName] = fieldToValueMap[workingSheetName] || {}
      fieldToValueMap[workingSheetName][workingRow] = fieldToValueMap[workingSheetName][workingRow] || {}
      fieldToValueMap[workingSheetName][workingRow] = Object.assign(fieldToValueMap[workingSheetName][workingRow], action.payload)
      // Object.keys(action.payload).forEach((field) => {
      //   if (!action.payload[field]) {
      //     delete fieldToValueMap[field];
      //   } else {
      //     fieldToValueMap[field] = action.payload[field];
      //   }
      // });
      return Object.assign({}, state, { fieldToValueMap });
    }
    case CORRECT_VALUE: {
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
      let dataFieldToRedcapFieldMap = state.dataFieldToRedcapFieldMap || {};
      let noMatchRedcapFields = state.noMatchRedcapFields || [];
      noMatchRedcapFields = _.union(noMatchRedcapFields, action.payload.noMatchRedcapFields)
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      const unmatchedDataFields = state.unmatchedDataFields;
      Object.keys(action.payload.dataFieldToRedcapFieldMap).forEach((sheet) => {
        if (state.unmatchedDataFields[sheet]) {
          unmatchedDataFields[sheet] = state.unmatchedDataFields[sheet].slice();
        }
        if (action.payload.dataFieldToRedcapFieldMap[sheet]) {
          Object.keys(action.payload.dataFieldToRedcapFieldMap[sheet]).forEach((dataField) => {
            let idx = unmatchedRedcapFields.indexOf(action.payload.dataFieldToRedcapFieldMap[sheet][dataField]);
            if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
            idx = unmatchedDataFields[sheet].indexOf(dataField);
            if (idx !== -1) unmatchedDataFields[sheet].splice(idx, 1);
          });
        }
      });

      if (action.payload.noMatchRedcapFields) {
        action.payload.noMatchRedcapFields.forEach((redcapField) => {
          let idx = unmatchedRedcapFields.indexOf(redcapField);
          if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
        });
      }

      dataFieldToRedcapFieldMap = _.merge(dataFieldToRedcapFieldMap, action.payload.dataFieldToRedcapFieldMap);
      return Object.assign({}, state, { dataFieldToRedcapFieldMap, unmatchedRedcapFields, unmatchedDataFields, noMatchRedcapFields });
    }
    case REMOVE_FIELD_MATCH: {
      const dataFieldToRedcapFieldMap = state.dataFieldToRedcapFieldMap || {};
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      let noMatchRedcapFields = []
      if (state.noMatchRedcapFields) {
        noMatchRedcapFields = state.noMatchRedcapFields.slice();
      }
      const sheet = action.payload.sheet;
      const unmatchedDataFields = state.unmatchedDataFields;
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
          delete dataFieldToRedcapFieldMap[sheet][action.payload.redcapField];
        }
      }
      return Object.assign({}, state, { dataFieldToRedcapFieldMap, unmatchedRedcapFields, unmatchedDataFields, noMatchRedcapFields });
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
