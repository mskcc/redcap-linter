import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Spin } from 'antd';
import PropTypes from 'prop-types';
import MatchedFields from './MatchedFields/MatchedFields';
import FieldMatcher from './FieldMatcher/FieldMatcher';
import './MatchFields.scss';
import { saveFields, removeFieldMatch } from '../../actions/RedcapLinterActions';

class MatchFields extends Component {
  constructor(props) {
    super(props);
    this.state = { };
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
    };
    saveFields(payload);
  }

  render() {
    const {
      ddData,
      matchingHeaders,
      redcapFieldToDataFieldMap,
      unmatchedRedcapFields,
      redcapFieldCandidates,
      removeFieldMatch,
      loading,
    } = this.props;
    let matchedFields = matchingHeaders.map(header => ({
      'REDCap Field': header,
      'Data Field': header,
    }));
    matchedFields = matchedFields.concat(Object.keys(redcapFieldToDataFieldMap).reduce((filtered, redcapField) => {
      if (redcapField && redcapFieldToDataFieldMap[redcapField]) {
        filtered.push({
          'REDCap Field': redcapField,
          'Data Field': redcapFieldToDataFieldMap[redcapField],
        });
      }
      return filtered;
    }, []));
    matchedFields = matchedFields.concat(Object.keys(redcapFieldToDataFieldMap).reduce((filtered, redcapField) => {
      if (redcapField && !redcapFieldToDataFieldMap[redcapField]) {
        filtered.push({
          'REDCap Field': redcapField,
          'Data Field': redcapFieldToDataFieldMap[redcapField],
        });
      }
      return filtered;
    }, []));
    if (redcapFieldToDataFieldMap['']) {
      matchedFields = matchedFields.concat(redcapFieldToDataFieldMap[''].map((dataField) => {
        return {
          'REDCap Field': '',
          'Data Field': dataField,
        }
      }));
    }


    let buttonText = 'Save and Continue';
    if (loading) {
      buttonText = <Spin />;
    }
    return (
      <div className="MatchFields-container">
        <div className="MatchFields-wrapFloats">
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
        </div>
        <div className="MatchFields-saveAndContinue">
          <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">{ buttonText }</button>
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
