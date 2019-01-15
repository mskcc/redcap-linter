import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'react-tabs/style/react-tabs.css';
import PropTypes from 'prop-types';
import Datatable from '../Datatable/Datatable';
import FieldMatcher from '../FieldMatcher/FieldMatcher';
import './MatchFields.css';
import { postForm } from '../../actions/RedcapLinterActions';

class MatchFields extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    let {
      matchingHeaders,
    } = this.props;
    const { unmatchedRedcapFields, fieldCandidates } = this.props;
    matchingHeaders = matchingHeaders.map(header => ({
      'REDCap Field': header,
      'Data Field': header,
    }));
    return (
      <div className="MatchFields-container">
        <div className="MatchFields-matchedFields">
          <div className="MatchFields-title">Matched Fields</div>
          <Datatable
            sheetName="Matched Fields"
            headers={['REDCap Field', 'Data Field']}
            tableData={matchingHeaders}
            editable={false}
          />
        </div>
        <div className="MatchFields-unmatchedFields">
          <div className="MatchFields-title">Unmatched Fields</div>
          <FieldMatcher
            fieldsToMatch={unmatchedRedcapFields}
            fieldCandidates={fieldCandidates}
          />
        </div>
      </div>
    );
  }
}

MatchFields.propTypes = {
  matchingHeaders: PropTypes.array,
  unmatchedRedcapFields: PropTypes.array,
  fieldCandidates: PropTypes.object,
};

MatchFields.defaultProps = {
  matchingHeaders: [],
  unmatchedRedcapFields: [],
  fieldCandidates: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchFields);
