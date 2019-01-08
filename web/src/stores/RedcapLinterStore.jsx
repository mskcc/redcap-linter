import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import RedcapLinterReducer from '../reducers/RedcapLinterReducer';

export default function configureStore(initialState = {}) {
  const store = createStore(RedcapLinterReducer, initialState, applyMiddleware(thunk));

  return { store };
}
