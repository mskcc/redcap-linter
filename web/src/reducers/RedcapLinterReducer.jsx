import {
  POST_FORM,
  POST_FORM_SUCCESS,
  POST_FORM_FAILURE,
  MATCH_FIELDS_SUCCESS,
  MATCH_FIELDS_FAILURE,
  REMOVE_FIELD_MATCH_SUCCESS,
  REMOVE_FIELD_MATCH_FAILURE,
  MATCH_CHOICES_SUCCESS,
  MATCH_CHOICES_FAILURE,
  REMOVE_CHOICE_MATCH_SUCCESS,
  REMOVE_CHOICE_MATCH_FAILURE,
  SAVE_FIELDS_SUCCESS,
  SAVE_FIELDS_FAILURE,
  SAVE_CHOICES_SUCCESS,
  SAVE_CHOICES_FAILURE,
  SAVE_ROW_SUCCESS,
  SAVE_ROW_FAILURE,
  NAVIGATE_TO_SUCCESS,
  NAVIGATE_TO_FAILURE,
  FILTER_TABLE_SUCCESS,
  FILTER_TABLE_FAILURE,
  FILTER_ROW_SUCCESS,
  FILTER_ROW_FAILURE,
  RESOLVE_COLUMN_SUCCESS,
  RESOLVE_COLUMN_FAILURE,
  RESOLVE_ROW_SUCCESS,
  RESOLVE_ROW_FAILURE,
  CORRECT_VALUE_SUCCESS,
  CORRECT_VALUE_FAILURE,
  UPDATE_VALUE_SUCCESS,
  UPDATE_VALUE_FAILURE,
} from '../actions/RedcapLinterActions';

export default function (state = {}, action) {
  switch (action.type) {
    case POST_FORM: {
      return Object.assign({}, { loading: true });
    }
    case POST_FORM_SUCCESS: {
      const error = { error: '' };
      if (action.payload.data && action.payload.data.error) {
        error.error = action.payload.data.error;
      }
      return Object.assign({}, action.payload.data, error);
    }
    case POST_FORM_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case SAVE_FIELDS_SUCCESS: {
      return Object.assign({}, state, action.payload.data);
    }
    case SAVE_FIELDS_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case SAVE_CHOICES_SUCCESS: {
      return Object.assign({}, state, action.payload.data);
    }
    case SAVE_CHOICES_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case SAVE_ROW_SUCCESS: {
      return Object.assign({}, state, action.payload.data);
    }
    case SAVE_ROW_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case FILTER_TABLE_SUCCESS: {
      return Object.assign({}, state, action.payload);
    }
    case FILTER_TABLE_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case FILTER_ROW_SUCCESS: {
      return Object.assign({}, state, action.payload);
    }
    case FILTER_ROW_FAILURE: {
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
    case RESOLVE_COLUMN_SUCCESS: {
      return Object.assign({}, state, action.payload.data);
    }
    case RESOLVE_COLUMN_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case RESOLVE_ROW_SUCCESS: {
      return Object.assign({}, state, action.payload.data);
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
      originalToCorrectedValueMap[action.payload.originalValue] = action.payload.correctedValue;
      const fieldErrors = state.fieldErrors || {};
      let textErrors = [];
      if (fieldErrors.textErrors) {
        textErrors = fieldErrors.textErrors.slice();
      }
      const idx = textErrors.indexOf(action.payload.originalValue);
      if (idx !== -1) textErrors.splice(idx, 1);
      fieldErrors.textErrors = textErrors;
      return Object.assign({}, state, { originalToCorrectedValueMap, fieldErrors, textErrors });
    }
    case CORRECT_VALUE_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case MATCH_CHOICES_SUCCESS: {
      const dataFieldToChoiceMap = state.dataFieldToChoiceMap || {};
      dataFieldToChoiceMap[action.payload.dataField] = action.payload.permissibleValue;
      const fieldErrors = state.fieldErrors || {};
      let unmatchedChoices = [];
      if (fieldErrors.unmatchedChoices) {
        unmatchedChoices = fieldErrors.unmatchedChoices.slice();
      }
      const idx = unmatchedChoices.indexOf(action.payload.dataField);
      if (idx !== -1) unmatchedChoices.splice(idx, 1);
      fieldErrors.unmatchedChoices = unmatchedChoices;
      return Object.assign({}, state, { dataFieldToChoiceMap, fieldErrors, unmatchedChoices });
    }
    case MATCH_CHOICES_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case REMOVE_CHOICE_MATCH_SUCCESS: {
      const dataFieldToChoiceMap = state.dataFieldToChoiceMap || {};
      delete dataFieldToChoiceMap[action.payload.dataField];
      const fieldErrors = state.fieldErrors || {};
      let unmatchedChoices = [];
      if (fieldErrors.unmatchedChoices) {
        unmatchedChoices = fieldErrors.unmatchedChoices.slice();
      }
      unmatchedChoices.unshift(action.payload.dataField);
      fieldErrors.unmatchedChoices = unmatchedChoices;
      return Object.assign({}, state, { dataFieldToChoiceMap, fieldErrors, unmatchedChoices });
    }
    case REMOVE_CHOICE_MATCH_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case MATCH_FIELDS_SUCCESS: {
      const redcapFieldToDataFieldMap = state.redcapFieldToDataFieldMap || {};
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      const idx = unmatchedRedcapFields.indexOf(action.payload.redcapField);
      if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
      redcapFieldToDataFieldMap[action.payload.redcapField] = action.payload.dataField;
      return Object.assign({}, state, { redcapFieldToDataFieldMap, unmatchedRedcapFields });
    }
    case MATCH_FIELDS_FAILURE: {
      let noMatchFields = [];
      if (state.noMatchFields) {
        noMatchFields = state.noMatchFields.slice();
      }
      noMatchFields.push(action.payload.redcapField);
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      const idx = unmatchedRedcapFields.indexOf(action.payload.redcapField);
      if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
      return Object.assign({}, state, { noMatchFields, unmatchedRedcapFields });
    }
    case REMOVE_FIELD_MATCH_SUCCESS: {
      const redcapFieldToDataFieldMap = state.redcapFieldToDataFieldMap || {};
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      unmatchedRedcapFields.unshift(action.payload.redcapField);
      delete redcapFieldToDataFieldMap[action.payload.redcapField];
      return Object.assign({}, state, { redcapFieldToDataFieldMap, unmatchedRedcapFields });
    }
    case REMOVE_FIELD_MATCH_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    default: {
      return state;
    }
  }
}
