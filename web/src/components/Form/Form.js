import React, { Component } from 'react';
import '../../App.css'
import './Form.css'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { postForm } from '../../actions/RedcapLinterActions';

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
      	dataDictionaryName: '',
      	dataFile: '',
      	dataFileName: '',
      	environment: 'test'
      }
    };
  }

  onSubmit() {
  	this.props.postForm(this.state.form);
  	console.log(this.state);
  }

  handleOnChangeForm(field, e) {
  	let newForm = this.state.form
  	newForm[field] = e.target.value
  	this.setState({form: newForm})
  }

  handleSelectedFile(field, e) {
  	let newForm = this.state.form
  	newForm[field] = e.target.files[0]
  	if (field === 'dataFile') {
  		newForm['dataFileName'] = e.target.value;
  	} else if (field === 'dataDictionary') {
  		newForm['dataDictionaryName'] = e.target.value;
  	}
    this.setState({form: newForm})
  }

  render() {
  	let form = this.state.form
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

	        <hr />

	        <fieldset className="App-fieldset">
	          <label className="App-fieldsetLabel">Datafile: </label>
	          <input className="App-fieldsetInput"
	            type="file"
	            value={form.dataFileName}
	            onChange={this.handleSelectedFile.bind(this, 'dataFile')} />
	        </fieldset>

	        <div className="Form-submitButtonDiv">
	        	<button onClick={this.onSubmit.bind(this)} className="App-submitButton">Submit</button>
	        </div>
	      </div>
    	);
	}
}

function mapStateToProps(state) {
  console.log(state)
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm: postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Form);