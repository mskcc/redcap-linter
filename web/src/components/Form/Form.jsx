import React, { Component } from 'react';
import '../../App.scss';
import './Form.scss';
import { Input, Spin } from 'antd';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { postForm } from '../../actions/RedcapLinterActions';

class Form extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorText: '',
      loading: false,
      form: {
        token: '',
        repeatableInstruments: '',
        dataDictionary: '',
        dataDictionaryName: '',
        dataFile: '',
        dataFileName: '',
        mappingsFile: '',
        mappingsFileName: '',
        environment: 'test',
      },
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if ('loading' in nextProps) {
      return { loading: nextProps.loading };
    }
    return null;
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
    this.setState({ errorText, loading: true });
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
    } else if (field === 'mappingsFile') {
      newForm.mappingsFileName = e.target.value;
    }
    this.setState({ form: newForm });
  }

  render() {
    const { form, loading } = this.state;
    let { errorText } = this.state;
    const {
      error,
      projectInfo,
      ddData,
      malformedSheets,
    } = this.props;
    let buttonText = 'Submit';
    if (loading) {
      buttonText = <Spin />;
    }
    let project = '';
    let warning = '';
    if (error) {
      errorText = `<ul><li>${error}</li></ul>`;
    } else {
      project += '<ul>';
      if (projectInfo.project_id) {
        project += `<li><b>Project ID</b>: ${projectInfo.project_id}</li>`;
      }
      if (projectInfo.project_title) {
        project += `<li><b>Project Title</b>: ${projectInfo.project_title}</li>`;
      }
      if (ddData && ddData[0]) {
        project += `<li><b>RecordID Field</b>: ${ddData[0].field_name}</li>`;
      }
      if (projectInfo.repeatable_instruments && projectInfo.repeatable_instruments.length > 0) {
        project += `<li><b>Repeatable Instruments</b>: ${projectInfo.repeatable_instruments.join(', ')}</li>`;
      }
      if (projectInfo.custom_record_label) {
        project += `<li><b>Custom Record Label</b>: ${projectInfo.custom_record_label}</li>`;
      }
      if (projectInfo.secondary_unique_field) {
        project += `<li><b>Secondary Unique Field</b>: ${projectInfo.secondary_unique_field}</li>`;
      }
      project += '</ul>';
      if (malformedSheets && malformedSheets.length > 0) {
        warning = `<ul><li><b>Sheets without matches to REDCap</b>: ${malformedSheets.join(', ')}<br /><b>Note</b>: Check to make sure the headers appear on the first row of the sheet.</li></ul>`;
      }
    }

    return (
      <div className="App-fieldsetColumn">
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel"><span className="Form-label">Environment</span></label>
          <label className="App-fieldsetRadioLabel" htmlFor="development">
            <Input
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
            <Input
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
            <Input
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
            <span className="Form-label">Token</span>
            <Input
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
            <span className="Form-label">Data-Dictionary</span>
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
            <span className="Form-label">Repeatable Instruments</span>
            <Input
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
          <label className="App-fieldsetLabel" htmlFor="mappingsFile">
            <span className="Form-label">Mappings File</span> (Optional)
            <input
              className="App-fieldsetInput"
              type="file"
              id="mappingsFile"
              accept=".xls,.xlsx"
              value={form.mappingsFileName}
              onChange={this.handleSelectedFile.bind(this, 'mappingsFile')}
            />
          </label>
        </fieldset>

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="dataFile">
            <span className="Form-label">Datafile</span>
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
          <button type="button" onClick={this.onSubmit.bind(this)} className="App-submitButton">{ buttonText }</button>
        </div>
        <div
          className="Form-projectInfo"
          dangerouslySetInnerHTML={{ __html: project }}
        />
        <div
          className="Form-malformedSheets"
          dangerouslySetInnerHTML={{ __html: warning }}
        />
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
