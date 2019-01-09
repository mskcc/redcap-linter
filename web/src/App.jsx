import React from 'react';
import { Provider } from 'react-redux';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import TabbedDatatable from './components/TabbedDatatable/TabbedDatatable';
import configureStore from './stores/RedcapLinterStore';
import './App.css';

const initialState = {
  csvHeaders: {},
  data: {},
};

const { store } = configureStore(initialState);

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <Header />
        <Form />
        <TabbedDatatable />
      </Provider>
    </div>
  );
}

export default App;
