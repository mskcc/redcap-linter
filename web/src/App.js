import React, { Component } from 'react';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import Datatable from './components/Datatable/Datatable';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <Form />
        <Datatable />
      </div>
    );
  }
}

export default App;
