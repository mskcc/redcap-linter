import React, { Component } from 'react';
import './ResolveMergeConflicts.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import MergeRecords from '../MergeRecords/MergeRecords';
import RepeatSelector from '../MergeRecords/RepeatSelector/RepeatSelector';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
// Remove this depencency
import { navigateTo } from '../../actions/REDCapLinterActions';
import { resolveMergeRow } from '../../actions/ResolveActions';

class ResolveMergeConflicts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      mode: 'CHOOSE_RECONCILIATION_COLUMNS',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if ('loading' in nextProps) {
      return { loading: nextProps.loading };
    }
    return null;
  }

  merge() {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      workingMergeRow,
      malformedSheets,
      mergeConflicts,
      resolveMergeRow,
    } = this.props;
    if (workingMergeRow >= 0) {
      this.setState({ mode: 'MERGE' });
      return;
    }
    let hasMergeConflicts = false;
    Object.keys(mergeConflicts).forEach((sheet) => {
      if (mergeConflicts[sheet] && mergeConflicts[sheet].length > 0) {
        hasMergeConflicts = true;
      }
    });
    if (workingMergeRow < 0 && hasMergeConflicts) {
      let nextSheetName = null;
      nextSheetName = Object.keys(mergeConflicts).find(
        sheet => mergeConflicts[sheet] && mergeConflicts[sheet].length > 0,
      );
      const nextMergeRow = mergeConflicts[nextSheetName][0];
      const payload = {
        jsonData,
        projectInfo,
        ddData,
        csvHeaders,
        mergeConflicts,
        malformedSheets,
        nextSheetName,
        nextMergeRow,
        action: 'continue',
      };
      // TODO Call on resolveRow if there are no column errors
      resolveMergeRow(payload);
    }

    this.setState({ mode: 'MERGE' });
  }

  back() {
    this.setState({ mode: 'CHOOSE_RECONCILIATION_COLUMNS' });
  }

  continue() {
    const { navigateTo } = this.props;

    navigateTo('finish');
  }

  render() {
    const { mergeConflicts, workingMergeRow } = this.props;
    const { loading, mode } = this.state;
    let content = '';
    let hasMergeConflicts = false;
    Object.keys(mergeConflicts).forEach((sheet) => {
      if (mergeConflicts[sheet] && mergeConflicts[sheet].length > 0) {
        hasMergeConflicts = true;
      }
    });
    let backButton = null;
    if (workingMergeRow >= 0) {
      backButton = (
        <button
          type="button"
          onClick={this.back.bind(this)}
          className="App-actionButton ResolveMergeConflicts-back"
        >
          Select Reconciliation Column(s)
        </button>
      );
    }
    if (loading) {
      content = <Spin tip="Loading..." />;
    } else if (hasMergeConflicts) {
      if (mode === 'CHOOSE_RECONCILIATION_COLUMNS') {
        content = (
          <div className="ResolveMergeConflicts-selector">
            <RepeatSelector />
            <button type="button" onClick={this.merge.bind(this)} className="App-submitButton">
              Continue
            </button>
          </div>
        );
      } else if (mode === 'MERGE') {
        content = (
          <div>
            {backButton}
            <MergeRecords />
          </div>
        );
      }
    } else {
      content = (
        <div>
          <p>Nothing to Merge</p>
          <button type="button" onClick={this.continue.bind(this)} className="App-submitButton">
            Continue
          </button>
        </div>
      );
    }
    return (
      <div className="ResolveMergeConflicts-container">
        {content}
        <TabbedDatatable />
      </div>
    );
  }
}

ResolveMergeConflicts.propTypes = {
  ddData: PropTypes.arrayOf(PropTypes.object),
  jsonData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  workingMergeRow: PropTypes.number,
  mergeConflicts: PropTypes.objectOf(PropTypes.array),
};

ResolveMergeConflicts.defaultProps = {
  ddData: {},
  jsonData: {},
  projectInfo: {},
  csvHeaders: {},
  malformedSheets: [],
  workingMergeRow: -1,
  mergeConflicts: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveMergeRow, navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResolveMergeConflicts);
