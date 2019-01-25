import React from 'react';
import { Provider } from 'react-redux';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import Linter from './components/Linter/Linter';
import configureStore from './stores/RedcapLinterStore';
import './App.scss';

const initialState = {
  csvHeaders: {},
  data: {},
};

const { store } = configureStore(initialState);

function App() {
  return (
    <div className="App">
      <div className="App-content">
        <Provider store={store}>
          <Header />
          <Form />
          <Linter />
        </Provider>
      </div>
      <div className="App-footer"></div>
    </div>
  );
}

export default App;
