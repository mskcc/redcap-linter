import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Spin, Modal } from 'antd';
import PropTypes from 'prop-types';
import MatchedFields from './MatchedFields/MatchedFields';
import FieldMatcher from './FieldMatcher/FieldMatcher';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import ProjectInfo from '../ProjectInfo/ProjectInfo';
import ActionMenu from '../ActionMenu/ActionMenu';
import './MatchFields.scss';
import { saveFields, removeFieldMatch } from '../../actions/RedcapLinterActions';

class MatchFields extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingSave: false,
      loadingContinue: false,
      showModal: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      loading,
    } = nextProps;
    if (!loading) {
      return { loadingSave: false, loadingContinue: false };
    }
    return null;
  }

  handleOk(e) {
    this.saveAndContinue(e)
    this.setState({ showModal: false });
  }

  handleCancel(e) {
    console.log(e);
    this.setState({
      showModal: false,
    });
  }

  saveFields(e) {
    const {
      jsonData,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      existingRecords,
      recordidField,
      saveFields,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      existingRecords,
      recordidField,
    };
    saveFields(payload);
    this.setState({ loadingSave: true });
  }

  saveAndContinue(e) {
    const {
      jsonData,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      existingRecords,
      recordidField,
      saveFields,
    } = this.props;
    let hasUnsavedFields = false;
    Object.keys(matchedFieldMap).forEach((sheet) => {
      const selectedFields = Object.keys(matchedFieldMap[sheet]);
      if (selectedFields) {
        selectedFields.forEach((field) => {
          if (dataFieldToRedcapFieldMap[sheet] && !dataFieldToRedcapFieldMap[sheet][field]) {
            hasUnsavedFields = true;
          }
        });
      }
    });
    if (hasUnsavedFields) {
      this.setState({ showModal: true });
      return;
    }
    const payload = {
      jsonData,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      existingRecords,
      recordidField,
      action: 'continue',
    };
    saveFields(payload);
    this.setState({ loadingContinue: true });
  }

  render() {
    const {
      ddData,
      matchingHeaders,
      dataFieldToRedcapFieldMap,
      unmatchedRedcapFields,
      redcapFieldCandidates,
      matchedFieldMap,
      noMatchRedcapFields,
      removeFieldMatch,
    } = this.props;
    let matchedFields = Object.keys(dataFieldToRedcapFieldMap).reduce((filtered, sheet) => {
      Object.keys(dataFieldToRedcapFieldMap[sheet]).forEach((dataField) => {
        if (dataField && dataFieldToRedcapFieldMap[sheet][dataField]) {
          filtered.push({
            'REDCap Field': dataFieldToRedcapFieldMap[sheet][dataField],
            'Data Field': dataField,
            'Sheet': sheet,
          });
        }
      });
      return filtered;
    }, []);
    matchedFields = matchedFields.concat(Object.keys(dataFieldToRedcapFieldMap).reduce((filtered, sheet) => {
      Object.keys(dataFieldToRedcapFieldMap[sheet]).forEach((dataField) => {
        if (dataField && !dataFieldToRedcapFieldMap[sheet][dataField]) {
          filtered.push({
            'REDCap Field': dataFieldToRedcapFieldMap[sheet][dataField],
            'Data Field': dataField,
            'Sheet': sheet,
          });
        }
      });
      return filtered;
    }, []));
    if (noMatchRedcapFields) {
      matchedFields = matchedFields.concat(noMatchRedcapFields.map((redcapField) => {
        return {
          'REDCap Field': redcapField,
          'Data Field': '',
          'Sheet': '',
        }
      }));
    }

    let hasUnsavedFields = false;
    Object.keys(matchedFieldMap).forEach((sheet) => {
      const selectedFields = Object.keys(matchedFieldMap[sheet]);
      if (selectedFields) {
        selectedFields.forEach((field) => {
          if (dataFieldToRedcapFieldMap[sheet] && !dataFieldToRedcapFieldMap[sheet][field]) {
            hasUnsavedFields = true;
          }
        });
      }
    });

    const {
      loadingSave,
      loadingContinue,
      showModal
    } = this.state;

    let saveButtonText = 'Save';
    if (loadingSave) {
      saveButtonText = <Spin />;
    }

    let continueButtonText = 'Save and Continue';
    if (loadingContinue) {
      continueButtonText = <Spin />;
    }
    let fieldMatcher = <FieldMatcher showModal={showModal} />;
    return (
      <div>
        <div>
          <ActionMenu />
          <ProjectInfo />
          <div className="MatchFields-container">
            <div>
              <div className="MatchFields-matchedFields">
                <div className="MatchFields-title">Matched Fields</div>
                <MatchedFields
                  removeFieldMatch={removeFieldMatch}
                  tableData={matchedFields}
                />
              </div>
              <div className="MatchFields-unmatchedFields">
                <div className="MatchFields-title">Unmatched Fields</div>
                { fieldMatcher }
              </div>
              <div style={{ clear: 'both' }} />
            </div>
            <div className="MatchFields-saveAndContinue">
              <button type="button" onClick={this.saveFields.bind(this)} className="App-actionButton">{ saveButtonText }</button>
              <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">{ continueButtonText }</button>
            </div>
            <Modal
              title="Confirm Fields"
              width={800}
              visible={this.state.showModal}
              onOk={this.handleOk.bind(this)}
              okButtonProps={{ disabled: hasUnsavedFields }}
              onCancel={this.handleCancel.bind(this)}
            >
              <p>You have unaccepted matches. Would you like to Accept or Reject these matches?</p>
              { fieldMatcher }
            </Modal>
          </div>
          <div style={{ clear: 'both' }} />
        </div>
        <div className="MatchFields-tabbedDatatable">
          <TabbedDatatable />
        </div>
      </div>
    );
  }
}

MatchFields.propTypes = {
  matchingHeaders: PropTypes.array,
  unmatchedRedcapFields: PropTypes.array,
  noMatchRedcapFields: PropTypes.array,
  existingRecords: PropTypes.array,
  recordidField: PropTypes.string,
  redcapFieldCandidates: PropTypes.object,
  dataFieldToRedcapFieldMap: PropTypes.object,
  matchedFieldMap: PropTypes.object,
};

MatchFields.defaultProps = {
  matchingHeaders: [],
  unmatchedRedcapFields: [],
  noMatchRedcapFields: [],
  existingRecords: [],
  redcapFieldCandidates: {},
  dataFieldToRedcapFieldMap: {},
  matchedFieldMap: {},
  recordidField: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveFields, removeFieldMatch }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchFields);
