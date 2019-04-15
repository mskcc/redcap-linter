import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Spin } from 'antd';
import PropTypes from 'prop-types';
import MatchedFields from './MatchedFields/MatchedFields';
import FieldMatcher from './FieldMatcher/FieldMatcher';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import ProjectInfo from '../ProjectInfo/ProjectInfo';
import ErrorSelector from '../ErrorSelector/ErrorSelector';
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
      redcapFieldToDataFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      saveFields,
    } = this.props;
    const payload = {
      jsonData,
      redcapFieldToDataFieldMap,
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
      redcapFieldToDataFieldMap,
      projectInfo,
      ddData,
      dateColumns,
      csvHeaders,
      saveFields,
    } = this.props;
    const payload = {
      jsonData,
      redcapFieldToDataFieldMap,
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
      redcapFieldToDataFieldMap,
      unmatchedRedcapFields,
      redcapFieldCandidates,
      removeFieldMatch,
    } = this.props;
    let matchedFields = Object.keys(redcapFieldToDataFieldMap).reduce((filtered, sheet) => {
      Object.keys(redcapFieldToDataFieldMap[sheet]).forEach((redcapField) => {
        if (redcapField && redcapFieldToDataFieldMap[sheet][redcapField]) {
          filtered.push({
            'REDCap Field': redcapField,
            'Data Field': redcapFieldToDataFieldMap[sheet][redcapField],
            'Sheet': sheet,
          });
        }
      });
      return filtered;
    }, []);
    matchedFields = matchedFields.concat(Object.keys(redcapFieldToDataFieldMap).reduce((filtered, sheet) => {
      Object.keys(redcapFieldToDataFieldMap[sheet]).forEach((redcapField) => {
        if (redcapField && !redcapFieldToDataFieldMap[sheet][redcapField]) {
          filtered.push({
            'REDCap Field': redcapField,
            'Data Field': redcapFieldToDataFieldMap[sheet][redcapField],
            'Sheet': sheet,
          });
        }
      });
      return filtered;
    }, []));
    if (redcapFieldToDataFieldMap['']) {
      matchedFields = matchedFields.concat(redcapFieldToDataFieldMap[''].map((dataField) => {
        return {
          'REDCap Field': '',
          'Data Field': dataField,
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
          <ErrorSelector />
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
  redcapFieldCandidates: PropTypes.object,
  redcapFieldToDataFieldMap: PropTypes.object,
};

MatchFields.defaultProps = {
  matchingHeaders: [],
  unmatchedRedcapFields: [],
  redcapFieldCandidates: {},
  redcapFieldToDataFieldMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveFields, removeFieldMatch }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchFields);
