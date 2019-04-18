import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Spin } from 'antd';
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

  saveFields(e) {
    const {
      jsonData,
      dataFieldToRedcapFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      saveFields,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToRedcapFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
    };
    saveFields(payload);
    this.setState({ loadingSave: true });
  }

  saveAndContinue(e) {
    const {
      jsonData,
      dataFieldToRedcapFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      saveFields,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToRedcapFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
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

    const {
      loadingSave,
      loadingContinue,
    } = this.state;

    let saveButtonText = 'Save';
    if (loadingSave) {
      saveButtonText = <Spin />;
    }

    let continueButtonText = 'Save and Continue';
    if (loadingContinue) {
      continueButtonText = <Spin />;
    }
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
                <FieldMatcher />
              </div>
              <div style={{ clear: 'both' }} />
            </div>
            <div className="MatchFields-saveAndContinue">
              <button type="button" onClick={this.saveFields.bind(this)} className="App-actionButton">{ saveButtonText }</button>
              <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">{ continueButtonText }</button>
            </div>
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
  redcapFieldCandidates: PropTypes.object,
  dataFieldToRedcapFieldMap: PropTypes.object,
};

MatchFields.defaultProps = {
  matchingHeaders: [],
  unmatchedRedcapFields: [],
  noMatchRedcapFields: [],
  redcapFieldCandidates: {},
  dataFieldToRedcapFieldMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveFields, removeFieldMatch }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchFields);
