import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'react-tabs/style/react-tabs.css';
import PropTypes from 'prop-types';
import MatchedFields from '../MatchedFields/MatchedFields';
import FieldMatcher from '../FieldMatcher/FieldMatcher';
import './MatchFields.css';
import { saveFields } from '../../actions/RedcapLinterActions';

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
      saveFields,
    } = this.props;
    const payload = {
      jsonData,
      redcapFieldToDataFieldMap,
      projectInfo,
      ddData,
    };
    saveFields(payload);
  }

  render() {
    const {
      matchingHeaders,
      redcapFieldToDataFieldMap,
      noMatchFields,
      unmatchedRedcapFields,
      fieldCandidates,
    } = this.props;
    let matchedFields = matchingHeaders.map(header => ({
      'REDCap Field': header,
      'Data Field': header,
    }));
    matchedFields = matchedFields.concat(Object.keys(redcapFieldToDataFieldMap).map(redcapField => ({
      'REDCap Field': redcapField,
      'Data Field': redcapFieldToDataFieldMap[redcapField],
    })));
    matchedFields = matchedFields.concat(noMatchFields.map(redcapField => ({
      'REDCap Field': redcapField,
      'Data Field': '',
    })));
    return (
      <div className="MatchFields-container">
        <div className="MatchFields-matchedFields">
          <div className="MatchFields-title">Matched Fields</div>
          <MatchedFields
            tableData={matchedFields}
          />
        </div>
        <div className="MatchFields-unmatchedFields">
          <div className="MatchFields-title">Unmatched Fields</div>
          <FieldMatcher
            fieldsToMatch={unmatchedRedcapFields}
            fieldCandidates={fieldCandidates}
          />
        </div>
        <div className="MatchFields-saveAndContinue">
          <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">Save and Continue</button>
        </div>
      </div>
    );
  }
}

MatchFields.propTypes = {
  matchingHeaders: PropTypes.array,
  unmatchedRedcapFields: PropTypes.array,
  fieldCandidates: PropTypes.object,
  redcapFieldToDataFieldMap: PropTypes.object,
  noMatchFields: PropTypes.array,
};

MatchFields.defaultProps = {
  matchingHeaders: [],
  unmatchedRedcapFields: [],
  fieldCandidates: {},
  redcapFieldToDataFieldMap: {},
  noMatchFields: [],
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveFields }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchFields);
