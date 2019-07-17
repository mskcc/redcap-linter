import React, { Component } from 'react';
import './ResolveMergeConflicts.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Spin, Icon } from 'antd';
import MergeRecords from '../MergeRecords/MergeRecords';
import RepeatSelector from '../MergeRecords/RepeatSelector/RepeatSelector';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import { navigateTo } from '../../actions/REDCapLinterActions';
import { calculateMergeConflicts } from '../../actions/ResolveActions';

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
      decodedRecords,
      existingRecords,
      recordidField,
      malformedSheets,
      reconciliationColumns,
      calculateMergeConflicts,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      existingRecords,
      decodedRecords,
      recordidField,
      malformedSheets,
      reconciliationColumns,
    };
    calculateMergeConflicts(payload);

    this.setState({ mode: 'MERGE' });
  }

  forward() {
    const { navigateTo } = this.props;
    navigateTo('finish');
  }

  back() {
    const { navigateTo } = this.props;
    navigateTo('lint');
  }

  selectReconciliationColumns() {
    this.setState({ mode: 'CHOOSE_RECONCILIATION_COLUMNS' });
  }

  continue() {
    const { navigateTo } = this.props;

    navigateTo('finish');
  }

  render() {
    const { mergeConflicts, calculatedMergeConflicts } = this.props;
    const { loading, mode } = this.state;
    let content = '';
    let hasMergeConflicts = false;
    Object.keys(mergeConflicts).forEach((sheet) => {
      if (mergeConflicts[sheet] && Object.keys(mergeConflicts[sheet]).length > 0) {
        hasMergeConflicts = true;
      }
    });
    if (loading) {
      content = <Spin tip="Loading..." />;
    } else if (!calculatedMergeConflicts || hasMergeConflicts) {
      if (mode === 'CHOOSE_RECONCILIATION_COLUMNS') {
        content = (
          <div>
            <div className="ResolveMergeConflicts-navigation">
              <button type="button" onClick={this.back.bind(this)} className="App-actionButton">
                <Icon type="left" />
                {' Back to Linting'}
              </button>
              <button type="button" onClick={this.forward.bind(this)} className="App-actionButton">
                {'Continue to Finish '}
                <Icon type="right" />
              </button>
            </div>
            <div className="ResolveMergeConflicts-selector">
              <RepeatSelector />
              <button type="button" onClick={this.merge.bind(this)} className="App-submitButton">
                Continue
              </button>
            </div>
          </div>
        );
      } else if (mode === 'MERGE') {
        content = (
          <div>
            <button
              type="button"
              onClick={this.selectReconciliationColumns.bind(this)}
              className="App-actionButton ResolveMergeConflicts-back"
            >
              Select Reconciliation Column(s)
            </button>
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
  jsonData: PropTypes.objectOf(PropTypes.array),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  recordidField: PropTypes.string,
  reconciliationColumns: PropTypes.objectOf(PropTypes.array),
  existingRecords: PropTypes.arrayOf(PropTypes.object),
  decodedRecords: PropTypes.objectOf(PropTypes.array),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  mergeConflicts: PropTypes.objectOf(PropTypes.object),
  calculatedMergeConflicts: PropTypes.bool,
};

ResolveMergeConflicts.defaultProps = {
  ddData: {},
  jsonData: {},
  projectInfo: {},
  csvHeaders: {},
  recordidField: '',
  reconciliationColumns: {},
  existingRecords: [],
  decodedRecords: {},
  malformedSheets: [],
  mergeConflicts: {},
  calculatedMergeConflicts: false,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ calculateMergeConflicts, navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResolveMergeConflicts);
