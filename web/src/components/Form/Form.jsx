import React, { Component } from 'react';
import '../../App.scss';
import './Form.scss';
import { Input, Spin } from 'antd';
import Select from 'react-select';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { postForm, changeEnvironment } from '../../actions/REDCapLinterActions';

export class Form extends Component {
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
        existingRecordsFile: '',
        existingRecordsFileName: '',
        environment: 'test',
      },
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.handleChangeEnvironment = this.handleChangeEnvironment.bind(this);
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
    const { postForm, env } = this.props;
    if (!form.token && !form.dataDictionary) {
      if (!errorText) {
        errorText += '<ul>';
      }
      errorText += '<li>Either token and environment or Data-Dictionary is required.</li>';
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
    this.setState({ errorText, loading: true });
    postForm({ form, env });
  }

  handleChangeEnvironment(option) {
    const { changeEnvironment } = this.props;
    changeEnvironment({ env: option.value });
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
    } else if (field === 'existingRecordsFile') {
      newForm.existingRecordsFileName = e.target.value;
    }
    this.setState({ form: newForm });
  }

  render() {
    const { form, loading } = this.state;
    let { errorText } = this.state;
    const { error, redcapUrls, env } = this.props;
    let buttonText = 'Submit';
    if (loading) {
      buttonText = <Spin />;
    }
    if (error) {
      errorText = `<ul><li>${error}</li></ul>`;
    }

    const options = [];
    let selectedValue = null;
    redcapUrls.forEach((redcapUrl) => {
      const option = {
        value: redcapUrl.redcap_base_url,
        label: (
          <span>
            <b>{redcapUrl.env}</b>
            <span style={{ fontWeight: 'lighter' }}>{` | ${redcapUrl.redcap_base_url}`}</span>
          </span>
        ),
      };
      if (env === redcapUrl.redcap_base_url) {
        selectedValue = option;
      }
      options.push(option);
    });

    return (
      <div className="App-fieldsetColumn">
        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel">
            <span className="Form-label">Environment</span>
          </label>
          <Select
            className="Form-environmentSelect"
            options={options}
            isSearchable
            value={selectedValue}
            onChange={option => this.handleChangeEnvironment(option)}
          />
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

        <hr />

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="mappingsFile">
            <span className="Form-label">Mappings File</span>
            {' (Optional)'}
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
          <label className="App-fieldsetLabel" htmlFor="existingRecordsFile">
            <span className="Form-label">Existing Records (Optional)</span>
            <input
              className="App-fieldsetInput"
              id="existingRecordsFile"
              type="file"
              accept=".csv"
              value={form.existingRecordsFileName}
              onChange={this.handleSelectedFile.bind(this, 'existingRecordsFile')}
            />
          </label>
        </fieldset>

        <hr />

        <fieldset className="App-fieldset">
          <label className="App-fieldsetLabel" htmlFor="dataFile">
            <span className="Form-label">Datafile</span>
            <input
              className="App-fieldsetInput"
              type="file"
              id="dataFile"
              accept=".xls,.xlsx,.csv"
              value={form.dataFileName}
              onChange={this.handleSelectedFile.bind(this, 'dataFile')}
            />
          </label>
        </fieldset>

        <div className="Form-submitButtonDiv">
          <button
            type="button"
            id="formSubmit"
            onClick={this.onSubmit}
            className="App-submitButton"
          >
            {buttonText}
          </button>
        </div>
        <div className="Form-errorText" dangerouslySetInnerHTML={{ __html: errorText }} />
      </div>
    );
  }
}

Form.propTypes = {
  error: PropTypes.objectOf(PropTypes.any),
  redcapUrls: PropTypes.arrayOf(PropTypes.object),
  env: PropTypes.string,
};

Form.defaultProps = {
  error: null,
  redcapUrls: [],
  env: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm, changeEnvironment }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Form);
