import React, { Component } from 'react';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import TabbedDatatable from './components/TabbedDatatable/TabbedDatatable';
import configureStore from './stores/RedcapLinterStore';
import { Provider } from 'react-redux';
import './App.css';

const { store } = configureStore();

class App extends Component {
  render() {
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
}

export default App;
