import React from 'react';
import { Provider } from 'react-redux';
import Header from './components/Header/Header';
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
          <Linter />
        </Provider>
      </div>
      <div className="App-footer"></div>
    </div>
  );
}

export default App;
