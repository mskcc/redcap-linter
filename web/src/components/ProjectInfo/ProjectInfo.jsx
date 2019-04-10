import React, { Component } from 'react';
import '../../App.scss';
import './ProjectInfo.scss';
import { Input, Spin } from 'antd';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';

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
    } = this.props;
    let project = '';
    let warning = '';
    if (!error) {
      project += '<div>';
      if (projectInfo.project_id) {
        project += `<b>Project ID</b>: ${projectInfo.project_id}<br />`;
      }
      if (projectInfo.project_title) {
        project += `<b>Project Title</b>: ${projectInfo.project_title}<br />`;
      }
      if (ddData && ddData[0]) {
        project += `<b>RecordID Field</b>: ${ddData[0].field_name}<br />`;
      }
      if (projectInfo.repeatable_instruments && projectInfo.repeatable_instruments.length > 0) {
        project += `<b>Repeatable Instruments</b>: ${projectInfo.repeatable_instruments.join(', ')}<br />`;
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

    return (
      <div className="ProjectInfo-container">
        <div
          className="ProjectInfo-projectInfo"
          dangerouslySetInnerHTML={{ __html: project }}
        />
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
  return bindActionCreators({ }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectInfo);
