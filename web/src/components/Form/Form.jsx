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
    if (!form.token && !form.dataDictionary) {
      if (!errorText) { errorText += '<ul>'; }
      errorText += '<li>Either token and environment or Data-Dictionary is required.</li>';
    }
    if (!form.dataFile) {
      if (!errorText) { errorText += '<ul>'; }
      errorText += '<li>Datafile is required.</li>';
    }
    if (errorText) {
      errorText += '</ul>';
      this.setState({ errorText });
      return;
    }
    this.setState({ errorText });
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
    const { form } = this.state;
    let { errorText } = this.state;
    const { error, projectInfo } = this.props;
    let project = '';
    if (error) {
      errorText = `<ul><li>${error}</li></ul>`;
    } else {
      console.log(projectInfo);
      project += '<ul>'
      if (projectInfo.project_id) {
        project += `<li>Project ID: ${projectInfo.project_id}</li>`
      }
      if (projectInfo.project_title) {
        project += `<li>Project Title: ${projectInfo.project_title}</li>`
      }
      if (projectInfo.repeatable_instruments && projectInfo.repeatable_instruments.length > 0) {
        project += `<li>Repeatable Instruments: ${projectInfo.repeatable_instruments.join(', ')}</li>`
      }
      if (projectInfo.custom_record_label) {
        project += `<li>Custom Record Label: ${projectInfo.custom_record_label}</li>`
      }
      if (projectInfo.secondary_unique_field) {
        project += `<li>Secondary Unique Field: ${projectInfo.secondary_unique_field}</li>`
      }
      project += '</ul>'
    }
    return (
      <div className="App-fieldsetColumn">
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel">Environment</label>
          <label className="App-fieldsetRadioLabel" htmlFor="development">
            <input
              className="App-fieldsetRadio"
              type="radio"
              id="development"
              value="development"
              checked={form.environment === 'development'}
              onChange={this.handleOnChangeForm.bind(this, 'environment')}
            />
              Development
          </label>
          <label className="App-fieldsetRadioLabel" htmlFor="test">
            <input
              className="App-fieldsetRadio"
              type="radio"
              id="test"
              value="test"
              checked={form.environment === 'test'}
              onChange={this.handleOnChangeForm.bind(this, 'environment')}
            />
             Test
          </label>
          <label className="App-fieldsetRadioLabel" htmlFor="production">
            <input
              className="App-fieldsetRadio"
              type="radio"
              id="production"
              value="production"
              checked={form.environment === 'production'}
              onChange={this.handleOnChangeForm.bind(this, 'environment')}
            />
            Production
          </label>
        </fieldset>
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="token">
            Token:
            <input
              className="App-fieldsetInput"
              id="token"
              type="text"
              placeholder="Token"
              value={form.token}
              onChange={this.handleOnChangeForm.bind(this, 'token')}
            />
          </label>
        </fieldset>

        <div className="emphasis">OR</div>

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="dataDictionary">
            Data-Dictionary:
            <input
              className="App-fieldsetInput"
              id="dataDictionary"
              type="file"
              accept=".csv,.xls,.xlsx"
              value={form.dataDictionaryName}
              onChange={this.handleSelectedFile.bind(this, 'dataDictionary')}
            />
          </label>
        </fieldset>
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="repeatableInstruments">
            Repeatable Instruments:
            <input
              className="App-fieldsetInput"
              id="repeatableInstruments"
              type="text"
              placeholder="Ex. Pathology, Imaging, etc."
              value={form.repeatableInstruments}
              onChange={this.handleOnChangeForm.bind(this, 'repeatableInstruments')}
            />
          </label>
        </fieldset>

        <hr />

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="dataFile">
            Datafile:
            <input
              className="App-fieldsetInput"
              type="file"
              id="dataFile"
              accept=".xls,.xlsx"
              value={form.dataFileName}
              onChange={this.handleSelectedFile.bind(this, 'dataFile')}
            />
          </label>
        </fieldset>

        <div className="Form-submitButtonDiv">
          <button type="button" onClick={this.onSubmit.bind(this)} className="App-submitButton">Submit</button>
        </div>
        <div
          className="Form-errorText"
          dangerouslySetInnerHTML={{ __html: errorText }}
        />
        <div
          className="Form-projectInfo"
          dangerouslySetInnerHTML={{ __html: project }}
        />
      </div>
    );
  }
}

Form.propTypes = {
  submitForm: PropTypes.func.isRequired,
  projectInfo: PropTypes.object,
  error: PropTypes.string,
};

Form.defaultProps = {
  error: '',
  projectInfo: {},
};


function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submitForm: postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Form);
