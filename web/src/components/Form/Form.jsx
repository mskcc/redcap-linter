import React, { Component } from 'react';
import '../../App.css';
import './Form.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { postForm } from '../../actions/RedcapLinterActions';

class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorText: '',
      form: {
        token: '',
        repeatableInstruments: '',
        dataDictionary: '',
        dataDictionaryName: '',
        dataFile: '',
        dataFileName: '',
        environment: 'test',
      },
    };
  }

  onSubmit() {
    let errorText = '';
    const { form } = this.state;
    const { submitForm } = this.props;
    // const { postForm } = this.props;
    if (!form.token && !(form.dataDictionary && form.repeatableInstruments)) {
      if (!errorText) {
        errorText += '<ul>';
      }
      errorText += '<li>Either token and environment or Data-Dictionary and list of repeatable instruments are required.</li>';
    }
    if (!form.dataFile) {
      if (!errorText) {
        errorText += '<ul>';
      }
      errorText += '<li>Datafile is required.</li>';
    }
    if (errorText) {
      errorText += '</ul>';
      this.setState({ errorText });
      return;
    }
    submitForm(form);
  }

  handleOnChangeForm(field, e) {
    const { form } = this.state;
    const newForm = form;
    newForm[field] = e.target.value;
    this.setState({ form: newForm });
  }

  handleSelectedFile(field, e) {
    const { form } = this.state;
    const newForm = form;
    newForm[field] = e.target.files[0];
    if (field === 'dataFile') {
      newForm.dataFileName = e.target.value;
    } else if (field === 'dataDictionary') {
      newForm.dataDictionaryName = e.target.value;
    }
    this.setState({ form: newForm });
  }

  render() {
    const { form, errorText } = this.state;
    return (
      <div className="App-fieldsetColumn">
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel">Environment</label>
          <label className="App-fieldsetRadioLabel">
            <input
              className="App-fieldsetRadio"
              type="radio"
              value="development"
              checked={this.state.form.environment === 'development'}
              onChange={this.handleOnChangeForm.bind(this, 'environment')}
            />
              Development
          </label>
          <label className="App-fieldsetRadioLabel">
            <input
              className="App-fieldsetRadio"
              type="radio"
              value="test"
              checked={this.state.form.environment === 'test'}
              onChange={this.handleOnChangeForm.bind(this, 'environment')}
            />
             Test
          </label>
            <label className="App-fieldsetRadioLabel">
              <input
                className="App-fieldsetRadio"
                type="radio"
                value="production"
                checked={this.state.form.environment === 'production'}
                onChange={this.handleOnChangeForm.bind(this, 'environment')}
              />
              Production
            </label>
        </fieldset>
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel">Token: </label>
          <input className="App-fieldsetInput"
            type="text"
            placeholder="Token"
            value={form.token}
            onChange={this.handleOnChangeForm.bind(this, 'token')}
          />
        </fieldset>

        <div className="emphasis">OR</div>

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="dataDictionary">Data-Dictionary: </label>
          <input
            className="App-fieldsetInput"
            id="dataDictionary"
            type="file"
            accept=".csv,.xls,.xlsx"
            value={form.dataDictionaryName}
            onChange={this.handleSelectedFile.bind(this, 'dataDictionary')}
          />
        </fieldset>
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="repeatableInstruments">Repeatable Instruments: </label>
          <input
            className="App-fieldsetInput"
            id="repeatableInstruments"
            type="text"
            placeholder="Ex. Pathology, Imaging, etc."
            value={form.repeatableInstruments}
            onChange={this.handleOnChangeForm.bind(this, 'repeatableInstruments')}
          />
        </fieldset>

        <hr />

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel">Datafile: </label>
          <input
            className="App-fieldsetInput"
            type="file"
            accept=".csv,.xls,.xlsx"
            value={form.dataFileName}
            onChange={this.handleSelectedFile.bind(this, 'dataFile')}
          />
        </fieldset>

        <div className="Form-submitButtonDiv">
          <button type="button" onClick={this.onSubmit.bind(this)} className="App-submitButton">Submit</button>
        </div>
        <div
          className="Form-errorText"
          dangerouslySetInnerHTML={{ __html: errorText }}
        />
      </div>
    );
  }
}

Form.propTypes = {
  submitForm: PropTypes.func.isRequired,
};


function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submitForm: postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Form);
