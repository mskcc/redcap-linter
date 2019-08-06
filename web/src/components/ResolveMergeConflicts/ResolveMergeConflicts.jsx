import React, { Component } from 'react';
import './ResolveMergeConflicts.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Spin, Icon } from 'antd';
import ActionMenu from '../ActionMenu/ActionMenu';
import MergeRecords from '../MergeRecords/MergeRecords';
import RepeatSelector from '../MergeRecords/RepeatSelector/RepeatSelector';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import ButtonMenu from '../ButtonMenu/ButtonMenu';
import { navigateTo, uploadExistingRecords } from '../../actions/REDCapLinterActions';
import { calculateMergeConflicts } from '../../actions/ResolveActions';
import { getNextMergeRow } from '../../utils/utils';

class ResolveMergeConflicts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      calculatedMergeConflicts: false,
      existingRecordsFileName: '',
      existingRecordsFile: null,
      mode: 'CHOOSE_RECONCILIATION_COLUMNS',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      mergeConflicts, workingSheetName, workingMergeRow, loadingResolve,
    } = nextProps;
    // This is unintuitive, consider reworking
    if (loadingResolve) {
      return {
        loading: true,
      };
    }
    const next = getNextMergeRow(mergeConflicts, workingSheetName, workingMergeRow);
    const { nextSheetName, nextMergeRow } = next;

    if (prevState.loading && !nextProps.loadingResolve) {
      return {
        loading: false,
        calculatedMergeConflicts: true,
        nextSheetName,
        nextMergeRow,
      };
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

    this.setState({ mode: 'MERGE' });
    calculateMergeConflicts(payload);
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
    this.setState({ mode: 'CHOOSE_RECONCILIATION_COLUMNS', calculatedMergeConflicts: false });
  }

  skip() {
    const { navigateTo } = this.props;

    navigateTo('finish');
  }

  upload() {
    const { uploadExistingRecords } = this.props;

    const { existingRecordsFile, existingRecordsFileName } = this.state;

    uploadExistingRecords({ existingRecordsFileName, existingRecordsFile });
  }

  handleSelectedFile(field, e) {
    this.setState({
      existingRecordsFileName: e.target.value,
      existingRecordsFile: e.target.files[0],
    });
  }

  render() {
    const {
      mergeConflicts,
      workingSheetName,
      workingMergeRow,
      existingRecords,
      token,
    } = this.props;

    const {
      loading,
      mode,
      calculatedMergeConflicts,
      nextSheetName,
      nextMergeRow,
      existingRecordsFileName,
    } = this.state;

    let remainingRows = 0;
    let content = '';
    let hasMergeConflicts = false;
    Object.keys(mergeConflicts).forEach((sheet) => {
      const conflictCount = Object.keys(mergeConflicts[sheet]).length;
      if (mergeConflicts[sheet] && Object.keys(mergeConflicts[sheet]).length > 0) {
        hasMergeConflicts = true;
        remainingRows += conflictCount;
      }
    });

    // TODO Calculate nextMergeRow
    let nextItemToResolve = '';
    let lastRowText = '';
    if (remainingRows === 1) {
      lastRowText = 'This is the last row to merge.';
    } else if (nextMergeRow >= 0) {
      nextItemToResolve = (
        <div className="ResolveMergeConflicts-next">
          <b>Next Sheet</b>
          {`: ${nextSheetName}`}
          <br />
          <b>Next Row</b>
          {`: ${nextMergeRow + 2}`}
        </div>
      );
    }

    let title = '';
    if (workingSheetName && workingMergeRow >= 0) {
      title = (
        <div className="ResolveMergeConflicts-header">
          <div className="ResolveMergeConflicts-columnDetails">
            <b>Sheet</b>
            {`: ${workingSheetName}`}
            <br />
            <b>Row</b>
            {` : ${workingMergeRow + 2}`}
          </div>
          <div className="ResolveMergeConflicts-progress">
            <b>Remaining Rows</b>
            {`: ${remainingRows}`}
          </div>
          {nextItemToResolve}
        </div>
      );
    }
    if (!token && !existingRecords) {
      content = (
        <div>
          <ActionMenu />
          <div className="ResolveMergeConflicts-mainContainer">
            <div className="ResolveMergeConflicts-navigation">
              <button type="button" onClick={this.back.bind(this)} className="App-actionButton">
                <Icon type="left" />
                {' Lint'}
              </button>
              <button type="button" onClick={this.forward.bind(this)} className="App-actionButton">
                {'Finish '}
                <Icon type="right" />
              </button>
            </div>
            <div className="ResolveMergeConflicts-helpText">
              <p>
                To merge with existing records, you must supply a token so Linter can fetch records
                from REDCap or export a project's records by navigating to your Project Home in
                REDCap -> click on Export data -> click on Export Data in the table that says My
                Reports & Exports next to the row labeled All data
              </p>
              <div className="ResolveMergeConflicts-existingRecordsUpload">
                <label className="App-fieldsetLabel" htmlFor="existingRecordsFile">
                  <span className="ResolveMergeConflicts-label">Existing Records (Optional)</span>
                  <input
                    className="App-fieldsetInput"
                    id="existingRecordsFile"
                    type="file"
                    accept=".csv"
                    value={existingRecordsFileName}
                    onChange={this.handleSelectedFile.bind(this, 'existingRecordsFile')}
                  />
                </label>
              </div>
              <button type="button" onClick={this.skip.bind(this)} className="App-actionButton">
                Skip
              </button>
              <button type="button" onClick={this.upload.bind(this)} className="App-submitButton">
                Upload
              </button>
            </div>
          </div>
          <div style={{ clear: 'both' }} />
        </div>
      );
    } else if (loading) {
      content = <Spin tip="Loading..." />;
    } else if (!calculatedMergeConflicts || hasMergeConflicts) {
      if (mode === 'CHOOSE_RECONCILIATION_COLUMNS') {
        content = (
          <div>
            <ActionMenu />
            <div className="ResolveMergeConflicts-mainContainer">
              <div className="ResolveMergeConflicts-navigation">
                <button type="button" onClick={this.back.bind(this)} className="App-actionButton">
                  <Icon type="left" />
                  {' Lint'}
                </button>
                <button
                  type="button"
                  onClick={this.forward.bind(this)}
                  className="App-actionButton"
                >
                  {'Finish '}
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
            <div style={{ clear: 'both' }} />
          </div>
        );
      } else if (mode === 'MERGE') {
        content = (
          <div>
            <div className="ResolveMergeConflicts-back">
              {title}
              <ButtonMenu />
              <div className="ResolveMergeConflicts-navigationButtons">
                <button
                  type="button"
                  onClick={this.selectReconciliationColumns.bind(this)}
                  className="App-actionButton"
                >
                  Select Reconciliation Column(s)
                </button>
              </div>
              <div className="ResolveMergeConflicts-nextColumn">{lastRowText}</div>
            </div>
            <ActionMenu />
            <MergeRecords nextSheetName={nextSheetName} nextMergeRow={nextMergeRow} />
          </div>
        );
      }
    } else {
      content = (
        <div>
          <ActionMenu />
          <div className="ResolveMergeConflicts-mainContainer">
            <div className="ResolveMergeConflicts-navigation">
              <button type="button" onClick={this.back.bind(this)} className="App-actionButton">
                <Icon type="left" />
                {' Lint'}
              </button>
              <button type="button" onClick={this.forward.bind(this)} className="App-actionButton">
                {'Finish '}
                <Icon type="right" />
              </button>
            </div>
            <div className="ResolveMergeConflicts-selector">
              <p>Nothing to Merge</p>
              <div>
                <button
                  type="button"
                  onClick={this.selectReconciliationColumns.bind(this)}
                  className="App-actionButton"
                >
                  Select Reconciliation Column(s)
                </button>
                <button type="button" onClick={this.skip.bind(this)} className="App-submitButton">
                  Continue
                </button>
              </div>
            </div>
          </div>
          <div style={{ clear: 'both' }} />
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
  workingSheetName: PropTypes.string,
  workingMergeRow: PropTypes.number,
  token: PropTypes.string,
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
  workingSheetName: '',
  workingMergeRow: -1,
  token: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { calculateMergeConflicts, navigateTo, uploadExistingRecords },
    dispatch,
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResolveMergeConflicts);
