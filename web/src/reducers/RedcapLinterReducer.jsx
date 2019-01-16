import {
  POST_FORM_SUCCESS,
  POST_FORM_FAILURE,
  MATCH_FIELDS_SUCCESS,
  MATCH_FIELDS_FAILURE,
  SAVE_FIELDS_SUCCESS,
  SAVE_FIELDS_FAILURE,
} from '../actions/RedcapLinterActions';

export default function (state = {}, action) {
  switch (action.type) {
    case POST_FORM_SUCCESS: {
      const error = { error: '' };
      if (action.payload.data && action.payload.data.error) {
        error.error = action.payload.data.error;
      }
      return Object.assign({}, state, action.payload.data, error);
    }
    case POST_FORM_FAILURE: {
      return Object.assign({}, state, {
        error: action.payload,
      });
    }
    case SAVE_FIELDS_SUCCESS: {
      return Object.assign({}, state);
    }
    case SAVE_FIELDS_FAILURE: {
      return Object.assign({}, state);
    }
    case MATCH_FIELDS_SUCCESS: {
      const redcapFieldToDataFieldMap = state.redcapFieldToDataFieldMap || {};
      const fieldCandidates = state.fieldCandidates || {};
      delete fieldCandidates[action.payload.redcapField];
      Object.keys(fieldCandidates).forEach((field) => {
        const dataFieldCandidate = fieldCandidates[field].find(candidate => candidate.candidate === action.payload.dataField);
        const idx = fieldCandidates[field].indexOf(dataFieldCandidate);
        fieldCandidates[field].splice(idx, 1);
      });
      let unmatchedRedcapFields = [];
      if (state.unmatchedRedcapFields) {
        unmatchedRedcapFields = state.unmatchedRedcapFields.slice();
      }
      const idx = unmatchedRedcapFields.indexOf(action.payload.redcapField);
      if (idx !== -1) unmatchedRedcapFields.splice(idx, 1);
      redcapFieldToDataFieldMap[action.payload.redcapField] = action.payload.dataField;
      return Object.assign({}, state, { redcapFieldToDataFieldMap, unmatchedRedcapFields, fieldCandidates });
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
    default: {
      return state;
    }
  }
}
