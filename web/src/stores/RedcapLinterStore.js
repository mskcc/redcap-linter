import { createStore, applyMiddleware } from 'redux';
import RedcapLinterReducer from '../reducers/RedcapLinterReducer';
import thunk from 'redux-thunk';


export default function configureStore(initialState = {}) {
  const store = createStore(RedcapLinterReducer, applyMiddleware(thunk));

  return { store };
}