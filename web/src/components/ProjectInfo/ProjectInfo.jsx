import React, { Component } from 'react';
import '../../App.scss';
import './ProjectInfo.scss';
import Select from 'react-select';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';

import {
  changeRepeatableInstruments,
  changeSecondaryUniqueField,
} from '../../actions/REDCapLinterActions';

class ProjectInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    this.changeSecondaryUniqueField = this.changeSecondaryUniqueField.bind(this);
    this.changeRepeatableInstruments = this.changeRepeatableInstruments.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if ('loading' in nextProps) {
      return { loading: nextProps.loading };
    }
    return null;
  }

  changeRepeatableInstruments(selectedOptions) {
    const { changeRepeatableInstruments } = this.props;
    const newRepeatableInstruments = [];
    if (selectedOptions) {
      selectedOptions.forEach((option) => {
        newRepeatableInstruments.push(option.label);
      });
    }
    changeRepeatableInstruments({ repeatableInstruments: newRepeatableInstruments });
  }

  changeSecondaryUniqueField(selectedOptions) {
    const { changeSecondaryUniqueField } = this.props;
    const secondaryUniqueFields = [];
    if (selectedOptions && selectedOptions.length > 0) {
      selectedOptions.forEach((selectedOption) => {
        secondaryUniqueFields.push(selectedOption.value);
      });
    }
    changeSecondaryUniqueField({ secondaryUniqueField: secondaryUniqueFields });
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
      error, projectInfo, ddData, recordidField, malformedSheets, formNames,
    } = this.props;
    let project = '';
    let warning = '';
    let repeatableInstrumentsDisabled = false;
    const secondaryUniqueDisabled = false;
    const selectedSecondaryValue = [];
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
      if (projectInfo.secondary_unique_field && projectInfo.secondary_unique_field.length > 0) {
        // secondaryUniqueDisabled = true;
        projectInfo.secondary_unique_field.forEach((field) => {
          selectedSecondaryValue.push({
            value: field,
            label: field,
          });
        });
      }
      if (projectInfo.custom_record_label) {
        project += `<b>Custom Record Label</b>: ${projectInfo.custom_record_label}<br />`;
      }
      project += '</div>';
      if (malformedSheets && malformedSheets.length > 0) {
        warning = `<div><b>Sheets without matches to REDCap</b>: ${malformedSheets.join(
          ', ',
        )}<br /><b>Note</b>: Check to make sure the headers appear on the first row of the sheet.</div>`;
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

    const secondaryUniqueFieldOptions = [];
    ddData.forEach((ddField) => {
      secondaryUniqueFieldOptions.push({
        value: ddField.field_name,
        label: ddField.field_name,
      });
    });

    let secondaryUniqueSelector = null;
    let secondaryUniqueWarning = null;
    if (projectInfo.record_autonumbering_enabled === 1) {
      secondaryUniqueSelector = (
        <div className="ProjectInfo-repeatableInstruments">
          <div>
            <b>Secondary Unique Field(s)</b>
:
          </div>
          <Select
            className="ProjectInfo-elevate"
            options={secondaryUniqueFieldOptions}
            isSearchable
            isMulti
            isDisabled={secondaryUniqueDisabled}
            value={selectedSecondaryValue}
            onChange={this.changeSecondaryUniqueField}
          />
        </div>
      );
      if (!selectedSecondaryValue) {
        secondaryUniqueWarning = (
          <div className="ProjectInfo-warning">
            <b>Warning</b>
: If no secondary unique field is selected, REDCap Linter will not be able
            to reconcile with existing records.
          </div>
        );
      }
    }

    const repeatableInstrumentsSelector = (
      <div className="ProjectInfo-repeatableInstruments">
        <div>
          <b>Repeatable Instruments</b>
:
        </div>
        <Select
          className="ProjectInfo-elevate"
          options={repeatableInstrumentOptions}
          isMulti
          isSearchable
          isDisabled={repeatableInstrumentsDisabled}
          value={selectedValue}
          onChange={this.changeRepeatableInstruments}
        />
      </div>
    );

    return (
      <div className="ProjectInfo-container">
        <div className="ProjectInfo-projectInfo" dangerouslySetInnerHTML={{ __html: project }} />
        {repeatableInstrumentsSelector}
        {secondaryUniqueSelector}
        {secondaryUniqueWarning}
        <div className="ProjectInfo-warning" dangerouslySetInnerHTML={{ __html: warning }} />
      </div>
    );
  }
}

ProjectInfo.propTypes = {
  projectInfo: PropTypes.objectOf(PropTypes.any),
  ddData: PropTypes.arrayOf(PropTypes.object),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  formNames: PropTypes.arrayOf(PropTypes.string),
  error: PropTypes.string,
  recordidField: PropTypes.string,
};

ProjectInfo.defaultProps = {
  error: '',
  recordidField: '',
  ddData: [],
  malformedSheets: [],
  formNames: [],
  projectInfo: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ changeRepeatableInstruments, changeSecondaryUniqueField }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProjectInfo);
