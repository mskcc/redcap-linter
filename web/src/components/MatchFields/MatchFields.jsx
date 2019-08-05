import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Spin, Modal, Icon } from 'antd';
import PropTypes from 'prop-types';
import MatchedFields from './MatchedFields/MatchedFields';
import FieldMatcher from './FieldMatcher/FieldMatcher';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import ActionMenu from '../ActionMenu/ActionMenu';
import './MatchFields.scss';
import '../../App.scss';
import ButtonMenu from '../ButtonMenu/ButtonMenu';
import { saveFields, removeFieldMatch, navigateTo } from '../../actions/REDCapLinterActions';

class MatchFields extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingSave: false,
      loadingContinue: false,
      showModal: false,
    };
    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.forward = this.forward.bind(this);
    this.back = this.back.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { loading } = nextProps;
    if (!loading) {
      return { loadingSave: false, loadingContinue: false };
    }
    return null;
  }

  handleOk() {
    this.saveChanges('continue');
    this.setState({ showModal: false });
  }

  handleCancel() {
    this.setState({
      showModal: false,
    });
  }

  forward() {
    const { navigateTo } = this.props;
    navigateTo('lint');
  }

  back() {
    const { navigateTo } = this.props;
    navigateTo('intro');
  }

  saveChanges(action) {
    const {
      jsonData,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      existingRecords,
      token,
      env,
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
    if (action === 'continue' && hasUnsavedFields) {
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
      token,
      env,
      recordidField,
      action,
    };
    saveFields(payload);
    if (action === 'save') {
      this.setState({ loadingSave: true });
    } else if (action === 'continue') {
      this.setState({ loadingContinue: true });
    }
  }

  render() {
    const {
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      noMatchRedcapFields,
      removeFieldMatch,
    } = this.props;
    const { loadingSave, loadingContinue, showModal } = this.state;
    let matchedFields = Object.keys(dataFieldToRedcapFieldMap).reduce((filtered, sheet) => {
      Object.keys(dataFieldToRedcapFieldMap[sheet]).forEach((dataField) => {
        if (dataField && dataFieldToRedcapFieldMap[sheet][dataField]) {
          filtered.push({
            'REDCap Field': dataFieldToRedcapFieldMap[sheet][dataField],
            'Data Field': dataField,
            Sheet: sheet,
          });
        }
      });
      return filtered;
    }, []);
    matchedFields = matchedFields.concat(
      Object.keys(dataFieldToRedcapFieldMap).reduce((filtered, sheet) => {
        Object.keys(dataFieldToRedcapFieldMap[sheet]).forEach((dataField) => {
          if (dataField && !dataFieldToRedcapFieldMap[sheet][dataField]) {
            filtered.push({
              'REDCap Field': dataFieldToRedcapFieldMap[sheet][dataField],
              'Data Field': dataField,
              Sheet: sheet,
            });
          }
        });
        return filtered;
      }, []),
    );
    if (noMatchRedcapFields) {
      matchedFields = matchedFields.concat(
        noMatchRedcapFields.map(redcapField => ({
          'REDCap Field': redcapField,
          'Data Field': '',
          Sheet: '',
        })),
      );
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

    let saveButtonText = 'Save';
    if (loadingSave) {
      saveButtonText = <Spin />;
    }

    let continueButtonText = 'Save and Continue';
    if (loadingContinue) {
      continueButtonText = <Spin />;
    }
    const fieldMatcher = <FieldMatcher showModal={showModal} />;
    return (
      <div>
        <div className="MatchFields-navigation">
          <ButtonMenu />
          <div className="MatchFields-navigationButtons">
            <button
              type="button"
              onClick={() => {
                this.back();
              }}
              className="App-actionButton"
            >
              <Icon type="left" />
              {' Intro'}
            </button>
            <button
              type="button"
              onClick={() => {
                this.forward();
              }}
              className="App-actionButton"
            >
              {'Lint '}
              <Icon type="right" />
            </button>
          </div>
        </div>
        <div>
          <ActionMenu />
          <div className="MatchFields-container">
            <div>
              <div className="MatchFields-matchedFields">
                <div className="MatchFields-title">Matched Fields</div>
                <MatchedFields removeFieldMatch={removeFieldMatch} tableData={matchedFields} />
              </div>
              <div className="MatchFields-unmatchedFields">
                <div className="MatchFields-title">Unmatched Fields</div>
                {fieldMatcher}
              </div>
              <div style={{ clear: 'both' }} />
            </div>
            <div className="MatchFields-saveAndContinue">
              <button
                type="button"
                onClick={() => {
                  this.saveChanges('save');
                }}
                className="App-actionButton"
              >
                {saveButtonText}
              </button>
              <button
                type="button"
                id="unmatchedFieldsSaveAndContinue"
                onClick={() => {
                  this.saveChanges('continue');
                }}
                className="App-submitButton"
              >
                {continueButtonText}
              </button>
            </div>
            <Modal
              title="Confirm Fields"
              width={800}
              visible={showModal}
              onOk={() => {
                this.handleOk();
              }}
              okButtonProps={{ disabled: hasUnsavedFields }}
              onCancel={() => {
                this.handleCancel();
              }}
            >
              <p>You have unaccepted matches. Would you like to Accept or Reject these matches?</p>
              {fieldMatcher}
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
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.array),
  ddData: PropTypes.arrayOf(PropTypes.object),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  noMatchRedcapFields: PropTypes.arrayOf(PropTypes.string),
  existingRecords: PropTypes.arrayOf(PropTypes.object),
  dateColumns: PropTypes.arrayOf(PropTypes.string),
  recordidField: PropTypes.string,
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  matchedFieldMap: PropTypes.objectOf(PropTypes.object),
  token: PropTypes.string,
  env: PropTypes.string,
};

MatchFields.defaultProps = {
  projectInfo: {},
  jsonData: {},
  csvHeaders: {},
  ddData: [],
  noMatchRedcapFields: [],
  existingRecords: [],
  dateColumns: [],
  dataFieldToRedcapFieldMap: {},
  matchedFieldMap: {},
  recordidField: '',
  token: '',
  env: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveFields, removeFieldMatch, navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MatchFields);
