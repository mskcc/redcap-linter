import React, { Component } from 'react';
import '../../App.css'
import './Form.css'

class Form extends Component {

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  getStateFromProps(props) {
    return {
      form: props.form || {
      	token: '',
      	repeatableInstruments: '',
      	dataDictionary: '',
      	dataFile: '',
      	environment: 'test'
      }
    };
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   return shallowCompare(this, nextProps, nextState);
  // }

  handleOnChangeForm(field, e) {
  	let newForm = this.state.form
  	newForm[field] = e.target.value
  	this.setState({form: newForm})
  }

  render() {
  	let form = this.state.form
  	console.log(form);
    return (
		<div className="App-fieldsetColumn">
			<fieldset className="App-fieldset">
	          <label className="App-fieldsetLabel">Environment</label>
	          <label className="App-fieldsetRadioLabel">
	            <input className="App-fieldsetRadio"
	                    type='radio'
	                    value='development'
	                    checked={this.state.form.environment === 'development'}
	                    onChange={this.handleOnChangeForm.bind(this, 'environment')} />
	            Development
	          </label>
	          <label className="App-fieldsetRadioLabel">
	            <input className="App-fieldsetRadio"
	                    type='radio'
	                    value='test'
	                    checked={this.state.form.environment === 'test'}
	                    onChange={this.handleOnChangeForm.bind(this, 'environment')} />
	            Test
	          </label>
	          <label className="App-fieldsetRadioLabel">
	            <input className="App-fieldsetRadio"
	                    type='radio'
	                    value='production'
	                    checked={this.state.form.environment === 'production'}
	                    onChange={this.handleOnChangeForm.bind(this, 'environment')} />
	            Production
	          </label>
	        </fieldset>

	        <fieldset className="App-fieldset">
	          <label className="App-fieldsetLabel">Datafile: </label>
	          <input className="App-fieldsetInput"
	            type="file"
	            value={form.dataFile}
	            onChange={this.handleOnChangeForm.bind(this, 'dataFile')} />
	        </fieldset>

	        <hr />

    		<fieldset className="App-fieldset">
    		  <label className="App-fieldsetLabel">Token: </label>
	          <input className="App-fieldsetInput"
	            type="text"
	            placeholder="Token"
	            value={form.token}
	            onChange={this.handleOnChangeForm.bind(this, 'token')} />
	        </fieldset>

	        <div className="emphasis">OR</div>

	        <fieldset className="App-fieldset">
	          <label className="App-fieldsetLabel">Data-Dictionary: </label>
	          <input className="App-fieldsetInput"
	            type="file"
	            value={form.dataDictionary}
	            onChange={this.handleOnChangeForm.bind(this, 'dataDictionary')} />
	        </fieldset>
	        <fieldset className="App-fieldset">
	          <label className="App-fieldsetLabel">Repeatable Instruments: </label>
	          <input className="App-fieldsetInput"
	            type="text"
	            placeholder="Ex. Pathology, Imaging, etc."
	            value={form.repeatableInstruments}
	            onChange={this.handleOnChangeForm.bind(this, 'repeatableInstruments')} />
	        </fieldset>
	        <button className="App-submitButton">Submit</button>
	      </div>
    	);
	}
}

export default Form;