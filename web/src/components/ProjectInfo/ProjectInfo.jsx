import React, { Component } from 'react';
import '../../App.scss';
import './ProjectInfo.scss';
import { Input, Spin } from 'antd';
import Select from 'react-select';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';

import { changeRepeatableInstruments } from '../../actions/RedcapLinterActions';

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
      malformedSheets,
      formNames,
    } = this.props;
    let project = '';
    let warning = '';
    let disabled = false;
    if (!error) {
      project += '<div>';
      if (projectInfo.project_id) {
        project += `<b>Project ID</b>: ${projectInfo.project_id}<br />`;
        disabled = true;
      }
      if (projectInfo.project_title) {
        project += `<b>Project Title</b>: ${projectInfo.project_title}<br />`;
      }
      if (ddData && ddData[0]) {
        project += `<b>RecordID Field</b>: ${ddData[0].field_name}<br />`;
      }
      if (projectInfo.custom_record_label) {
        project += `<b>Custom Record Label</b>: ${projectInfo.custom_record_label}<br />`;
      }
      if (projectInfo.secondary_unique_field) {
        project += `<b>Secondary Unique Field</b>: ${projectInfo.secondary_unique_field}<br />`;
      }
      project += '</div>';
      if (malformedSheets && malformedSheets.length > 0) {
        warning = `<div><b>Sheets without matches to REDCap</b>: ${malformedSheets.join(', ')}<br /><b>Note</b>: Check to make sure the headers appear on the first row of the sheet.</div>`;
      }
    }

    const options = [];
    formNames.forEach((formName) => {
      options.push({
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

    let repeatableInstrumentsSelector = (<div className="ProjectInfo-repeatableInstruments">
        <div>
          <b>Repeatable Instruments</b>:
        </div>
        <Select
          className="ProjectInfo-elevate"
          options={options}
          isMulti
          isSearchable
          isDisabled={disabled}
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
        <div
          className="ProjectInfo-malformedSheets"
          dangerouslySetInnerHTML={{ __html: warning }}
        />
      </div>
    );
  }
}

ProjectInfo.propTypes = {
  projectInfo: PropTypes.object,
  error: PropTypes.string,
};

ProjectInfo.defaultProps = {
  error: '',
  projectInfo: {},
};


function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ changeRepeatableInstruments }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectInfo);
