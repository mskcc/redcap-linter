import axios from 'axios';
export const POST_FORM = 'POST_FORM';
export const POST_FORM_SUCCESS = 'POST_FORM_SUCCESS';
export const POST_FORM_FAILURE = 'POST_FORM_FAILURE';

export function postForm(form) {

  return function action(dispatch) {
    const request = axios({
      method: 'POST',
      url: 'http://localhost:5000/',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      data: form
    });
    
    return request.then(
      response => dispatch(postFormSuccess(response)),
      err => dispatch(postFormError(err))
    );
  }
}

export function postFormSuccess(results) {
	return {
		type: POST_FORM_SUCCESS,
		payload: results
	};
}

export function postFormError(error) {
	return {
		type: POST_FORM_FAILURE,
		payload: error
	};
}
