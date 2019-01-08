import { POST_FORM_SUCCESS, POST_FORM_FAILURE } from '../actions/RedcapLinterActions';

export default function(state = {}, action) {
  switch (action.type) {
    case POST_FORM_SUCCESS:
      return state['data'] = action.payload.data;
    case POST_FORM_FAILURE:
      return state['error'] = action.payload;
    default:
      return state
  }
}
