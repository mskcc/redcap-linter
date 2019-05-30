import React, { Component } from 'react';
import '../../App.scss';
import './ProjectInfo.scss';
import { Input, Spin } from 'antd';
import Select from 'react-select';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';

import { changeRepeatableInstruments, changeSecondaryUniqueField } from '../../actions/REDCapLinterActions';

class ProjectInfo extends Component {
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

  changeRepeatableInstruments(selectedOptions) {
    const {
      changeRepeatableInstruments,
    } = this.props;
    const newRepeatableInstruments = [];
    if (selectedOptions) {
      selectedOptions.forEach((option) => {
        newRepeatableInstruments.push(option.label);
      });
    }
    changeRepeatableInstruments({ repeatableInstruments: newRepeatableInstruments });
  }

  changeSecondaryUniqueField(selectedOption) {
    const {
      changeSecondaryUniqueField,
    } = this.props;
    changeSecondaryUniqueField({ secondaryUniqueField: selectedOption.value });
  }

  handleOnChangeProjectInfo(field, e) {
    const { form } = this.state;
    const newProjectInfo = form;
    newProjectInfo[field] = e.target.value;
    this.setState({ form: newProjectInfo });
  }

  handleSelectedFile(field, e) {
    const { form } = this.state;
    const newProjectInfo = form;
    newProjectInfo[field] = e.target.files[0];
    if (field === 'dataFile') {
      newProjectInfo.dataFileName = e.target.value;
    } else if (field === 'dataDictionary') {
      newProjectInfo.dataDictionaryName = e.target.value;
    } else if (field === 'mappingsFile') {
      newProjectInfo.mappingsFileName = e.target.value;
    }
    this.setState({ form: newProjectInfo });
  }

  render() {
    const {
      error,
      projectInfo,
      ddData,
      recordidField,
      malformedSheets,
      formNames,
    } = this.props;
    let project = '';
    let warning = '';
    let repeatableInstrumentsDisabled = false;
    let secondaryUniqueDisabled = false;
    let selectedSecondaryValue = null;
    if (!error) {
      project += '<div>';
      if (projectInfo.project_id) {
        project += `<b>Project ID</b>: ${projectInfo.project_id}<br />`;
        repeatableInstrumentsDisabled = true;
      }
      if (projectInfo.project_title) {
        project += `<b>Project Title</b>: ${projectInfo.project_title}<br />`;
      }
      if (recordidField) {
        project += `<b>RecordID Field</b>: ${recordidField}<br />`;
      }
      if (projectInfo.record_autonumbering_enabled === 1) {
        project += '<b>Record Autonumbering</b>: true<br />';
      } else {
        project += '<b>Record Autonumbering</b>: false<br />';
      }
      if (projectInfo.secondary_unique_field) {
        // secondaryUniqueDisabled = true;
        selectedSecondaryValue = {
          value: projectInfo.secondary_unique_field,
          label: projectInfo.secondary_unique_field,
        };
      }
      if (projectInfo.custom_record_label) {
        project += `<b>Custom Record Label</b>: ${projectInfo.custom_record_label}<br />`;
      }
      project += '</div>';
      if (malformedSheets && malformedSheets.length > 0) {
        warning = `<div><b>Sheets without matches to REDCap</b>: ${malformedSheets.join(', ')}<br /><b>Note</b>: Check to make sure the headers appear on the first row of the sheet.</div>`;
      }
    }

    const repeatableInstrumentOptions = [];
    formNames.forEach((formName) => {
      repeatableInstrumentOptions.push({
        value: formName,
        label: formName,
      });
    });

    const selectedValue = [];
    if (projectInfo.repeatable_instruments && projectInfo.repeatable_instruments.length > 0) {
      projectInfo.repeatable_instruments.forEach((ri) => {
        selectedValue.push({
          value: ri,
          label: ri,
        });
      });
    }

    const secondaryUniqueFieldOptions = []
    ddData.forEach((ddField) => {
      secondaryUniqueFieldOptions.push({
        value: ddField.field_name,
        label: ddField.field_name,
      });
    });

    let secondaryUniqueSelector = null;
    let secondaryUniqueWarning = null;
    if (projectInfo.record_autonumbering_enabled === 1) {
      secondaryUniqueSelector = (<div className="ProjectInfo-repeatableInstruments">
          <div>
            <b>Secondary Unique Field</b>:
          </div>
          <Select
            className="ProjectInfo-elevate"
            options={secondaryUniqueFieldOptions}
            isSearchable
            isDisabled={secondaryUniqueDisabled}
            value={selectedSecondaryValue}
            onChange={this.changeSecondaryUniqueField.bind(this)}
          />
        </div>);
        if (!selectedSecondaryValue) {
          secondaryUniqueWarning = (
            <div
              className="ProjectInfo-warning">
              <b>Warning</b>: If no secondary unique field is selected, REDCap Linter will not be able to reconcile with existing records.
            </div>
          );
        }
    }

    let repeatableInstrumentsSelector = (<div className="ProjectInfo-repeatableInstruments">
        <div>
          <b>Repeatable Instruments</b>:
        </div>
        <Select
          className="ProjectInfo-elevate"
          options={repeatableInstrumentOptions}
          isMulti
          isSearchable
          isDisabled={repeatableInstrumentsDisabled}
          value={selectedValue}
          onChange={this.changeRepeatableInstruments.bind(this)}
        />
      </div>);

    return (
      <div className="ProjectInfo-container">
        <div
          className="ProjectInfo-projectInfo"
          dangerouslySetInnerHTML={{ __html: project }}
        />
        { repeatableInstrumentsSelector }
        { secondaryUniqueSelector }
        { secondaryUniqueWarning }
        <div
          className="ProjectInfo-warning"
          dangerouslySetInnerHTML={{ __html: warning }}
        />
      </div>
    );
  }
}

ProjectInfo.propTypes = {
  projectInfo: PropTypes.object,
  error: PropTypes.string,
  recordidField: PropTypes.string,
};

ProjectInfo.defaultProps = {
  error: '',
  recordidField: '',
  projectInfo: {},
};


function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ changeRepeatableInstruments, changeSecondaryUniqueField }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectInfo);
