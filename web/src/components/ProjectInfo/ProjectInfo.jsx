import React, { Component } from 'react';
import '../../App.scss';
import './ProjectInfo.scss';
import { Input, Spin } from 'antd';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { postProjectInfo } from '../../actions/RedcapLinterActions';

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

  onSubmit() {
    let errorText = '';
    const { form } = this.state;
    const { submitProjectInfo } = this.props;
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
    submitProjectInfo(form);
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
  submitProjectInfo: PropTypes.func.isRequired,
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
  return bindActionCreators({ submitProjectInfo: postProjectInfo }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectInfo);
