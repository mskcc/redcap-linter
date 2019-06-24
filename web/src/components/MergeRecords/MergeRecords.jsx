import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import MergedRecord from './MergedRecord/MergedRecord';
import RecordMerger from './RecordMerger/RecordMerger';
import ActionMenu from '../ActionMenu/ActionMenu';
import './MergeRecords.scss';
import { resolveMergeRow } from '../../actions/ResolveActions';

class MergeRecords extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  saveChanges() {
    const {
      jsonData,
      mergeMap,
      projectInfo,
      ddData,
      workingMergeRow,
      workingSheetName,
      malformedSheets,
      mergeConflicts,
      decodedRecords,
      csvHeaders,
      resolveMergeRow,
    } = this.props;
    const payload = {
      jsonData,
      mergeMap,
      projectInfo,
      workingMergeRow,
      workingSheetName,
      malformedSheets,
      decodedRecords,
      mergeConflicts,
      ddData,
      csvHeaders,
      action: 'save',
    };
    resolveMergeRow(payload);
  }

  saveAndContinue() {
    const {
      jsonData,
      mergeMap,
      workingMergeRow,
      workingSheetName,
      malformedSheets,
      decodedRecords,
      projectInfo,
      ddData,
      csvHeaders,
      mergeConflicts,
      resolveMergeRow,
    } = this.props;
    const payload = {
      jsonData,
      mergeMap,
      projectInfo,
      workingMergeRow,
      workingSheetName,
      malformedSheets,
      mergeConflicts,
      decodedRecords,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    resolveMergeRow(payload);
  }

  render() {
    const { workingMergeRow } = this.props;

    if (workingMergeRow < 0) {
      return null;
    }

    return (
      <div>
        <ActionMenu />
        <div className="MergeRecords-container">
          <div>
            <div className="MergeRecords-unmatchedChoices">
              <div className="MergeRecords-title">Existing Record</div>
              <RecordMerger />
            </div>
            <div className="MergeRecords-matchedChoices">
              <div className="MergeRecords-title">Merged Record</div>
              <MergedRecord />
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="MergeRecords-saveAndContinue">
            <button
              type="button"
              onClick={this.saveChanges.bind(this)}
              className="MergeRecords-save"
            >
              Save
            </button>
            <button
              type="button"
              onClick={this.saveAndContinue.bind(this)}
              className="App-submitButton"
            >
              Save and Continue
            </button>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

MergeRecords.propTypes = {
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  jsonData: PropTypes.objectOf(PropTypes.array),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  ddData: PropTypes.arrayOf(PropTypes.object),
  mergeConflicts: PropTypes.objectOf(PropTypes.object),
  decodedRecords: PropTypes.objectOf(PropTypes.array),
  mergeMap: PropTypes.objectOf(PropTypes.object),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  workingSheetName: PropTypes.string,
  workingMergeRow: PropTypes.number,
};

MergeRecords.defaultProps = {
  csvHeaders: {},
  jsonData: {},
  projectInfo: {},
  ddData: [],
  mergeConflicts: {},
  decodedRecords: {},
  mergeMap: {},
  malformedSheets: [],
  workingSheetName: '',
  workingMergeRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveMergeRow }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MergeRecords);
