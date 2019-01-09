import { POST_FORM_SUCCESS, POST_FORM_FAILURE } from '../actions/RedcapLinterActions';

export default function (state = {}, action) {
  switch (action.type) {
    case POST_FORM_SUCCESS:
      return Object.assign({}, state, action.payload.data);
    case POST_FORM_FAILURE:
      return Object.assign({}, state, {
        error: action.payload,
      });
    default:
      return state;
  }
}
