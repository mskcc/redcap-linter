import React, { Component } from 'react';
import './ResolveMergeConflicts.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import MergeRecords from '../MergeRecords/MergeRecords';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
// Remove this depencency
import { resolveMergeRow, navigateTo } from '../../actions/RedcapLinterActions';

class ResolveMergeConflicts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if ('loading' in nextProps) {
      return { loading: nextProps.loading };
    }
    return null;
  }

  componentDidMount() {

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
      return;
    }
    let hasMergeConflicts = false;
    Object.keys(mergeConflicts).forEach((sheet) => {
      if (mergeConflicts[sheet] && mergeConflicts[sheet].length > 0) {
        hasMergeConflicts = true;
      }
    })
    if (workingMergeRow < 0 && hasMergeConflicts) {
      let nextSheetName = null;
      nextSheetName = Object.keys(mergeConflicts).find(sheet => mergeConflicts[sheet] && mergeConflicts[sheet].length > 0);
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
  }

  continue() {
    const {
      navigateTo,
    } = this.props;

    navigateTo('finish');
  }

  render() {
    const {
      mergeConflicts,
    } = this.props;
    const {
      loading,
    } = this.state;
    let content = '';
    let hasMergeConflicts = false;
    Object.keys(mergeConflicts).forEach((sheet) => {
      if (mergeConflicts[sheet] && mergeConflicts[sheet].length > 0) {
        hasMergeConflicts = true;
      }
    })
    if (loading) {
      content = <Spin tip="Loading..." />;
    } else if (hasMergeConflicts) {
      content = <MergeRecords />;
    } else {
      content = (
        <div>
          <p>Nothing to Merge</p>
          <button type="button" onClick={this.continue.bind(this)} className="App-submitButton">Continue</button>
        </div>
      );
    }
    return (
      <div className="ResolveMergeConflicts-container">
        { content }
        <TabbedDatatable />
      </div>
    );
  }
}

ResolveMergeConflicts.propTypes = {
  workingMergeRow: PropTypes.number,
  mergeConflicts: PropTypes.object,
};

ResolveMergeConflicts.defaultProps = {
  workingMergeRow: -1,
  mergeConflicts: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveMergeRow, navigateTo }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ResolveMergeConflicts);
