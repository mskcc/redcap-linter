import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Modal, Spin } from 'antd';
import ResolvedRowErrors from './ResolvedRowErrors/ResolvedRowErrors';
import RowResolver from './RowResolver/RowResolver';
import ActionMenu from '../ActionMenu/ActionMenu';
import './ResolveRow.scss';
import { filterRow, acceptRowMatches, removeRowMatch } from '../../actions/REDCapLinterActions';
import { resolveRow } from '../../actions/ResolveActions';

class ResolveRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      loadingSave: false,
      loadingContinue: false,
    };

    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { loadingResolve } = nextProps;
    if (!loadingResolve) {
      return { loadingSave: false, loadingContinue: false };
    }
    return null;
  }

  saveChanges(action) {
    const {
      jsonData,
      fieldToValueMap,
      matchedRowValueMap,
      projectInfo,
      ddData,
      workingRow,
      workingSheetName,
      columnsInError,
      rowsInError,
      csvHeaders,
      resolveRow,
    } = this.props;
    // TODO Only let the valid values pass
    let unsavedValueMap = {};
    if (matchedRowValueMap[workingSheetName] && matchedRowValueMap[workingSheetName][workingRow]) {
      unsavedValueMap = matchedRowValueMap[workingSheetName][workingRow];
    }
    if (action === 'continue' && Object.keys(unsavedValueMap).length > 0) {
      this.setState({ showModal: true });
      return;
    }
    const payload = {
      jsonData,
      fieldToValueMap,
      projectInfo,
      workingRow,
      workingSheetName,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action,
    };

    resolveRow(payload);
    if (action === 'save') {
      this.setState({ loadingSave: true });
    } else if (action === 'continue') {
      this.setState({ loadingContinue: true });
    }
  }

  handleOk() {
    this.saveChanges('continue');
    this.setState({ showModal: false });
  }

  handleCancel() {
    this.setState({
      showModal: false,
    });
  }

  render() {
    const {
      jsonData,
      cellsWithErrors,
      fieldToValueMap,
      workingSheetName,
      matchedRowValueMap,
      workingRow,
      csvHeaders,
      acceptRowMatches,
      removeRowMatch,
      filterRow,
    } = this.props;

    const { loadingSave, loadingContinue, showModal } = this.state;

    if (workingRow === -1 || workingRow === '') {
      return null;
    }

    let unsavedValueMap = {};
    if (matchedRowValueMap[workingSheetName] && matchedRowValueMap[workingSheetName][workingRow]) {
      unsavedValueMap = matchedRowValueMap[workingSheetName][workingRow];
    }

    const row = jsonData[workingSheetName][workingRow];
    const currentRowErrors = cellsWithErrors[workingSheetName][workingRow];

    let valueMap = {};
    if (fieldToValueMap[workingSheetName] && fieldToValueMap[workingSheetName][workingRow]) {
      valueMap = fieldToValueMap[workingSheetName][workingRow];
    }

    const sheetHeaders = csvHeaders[workingSheetName];
    const tableData = sheetHeaders.reduce((filtered, field) => {
      // TODO Figure out why date of prior visit is null
      if (!currentRowErrors[field] && !valueMap.hasOwnProperty(field)) {
        filtered.push({
          Field: field,
          Value: row[field] || '',
        });
      }
      return filtered;
    }, []);

    Object.keys(valueMap).forEach((field) => {
      tableData.unshift({
        Field: field,
        Value: valueMap[field],
      });
    });

    let saveButtonText = 'Save';
    if (loadingSave) {
      saveButtonText = <Spin />;
    }

    let continueButtonText = 'Save and Continue';
    if (loadingContinue) {
      continueButtonText = <Spin />;
    }
    const rowResolver = <RowResolver showModal={showModal} />;
    return (
      <div>
        <ActionMenu />
        <div className="ResolveRow-container">
          <div>
            <div className="ResolveRow-matchedChoices">
              <div className="ResolveRow-title">Row Data</div>
              <ResolvedRowErrors
                fieldToValueMap={fieldToValueMap}
                acceptRowMatches={acceptRowMatches}
                removeRowMatch={removeRowMatch}
                tableData={tableData}
                workingSheetName={workingSheetName}
                workingRow={workingRow}
              />
            </div>
            <div className="ResolveRow-unmatchedChoices">
              <div className="ResolveRow-title">Row Errors</div>
              {rowResolver}
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="ResolveRow-saveAndContinue">
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'save')}
              className="App-actionButton"
            >
              {saveButtonText}
            </button>
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'continue')}
              className="App-submitButton"
            >
              {continueButtonText}
            </button>
            <Modal
              title="Confirm Updates"
              width={800}
              visible={showModal}
              onOk={() => {
                this.handleOk();
              }}
              okButtonProps={{ disabled: Object.keys(unsavedValueMap).length > 0 }}
              onCancel={() => {
                this.handleCancel();
              }}
            >
              <p>You have unaccepted matches. Would you like to Accept or Reject these matches?</p>
              {rowResolver}
            </Modal>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

ResolveRow.propTypes = {
  fieldToValueMap: PropTypes.objectOf(PropTypes.object),
  matchedRowValueMap: PropTypes.objectOf(PropTypes.any),
  ddData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingRow: PropTypes.number,
};

ResolveRow.defaultProps = {
  ddData: [],
  projectInfo: {},
  jsonData: {},
  csvHeaders: {},
  cellsWithErrors: {},
  fieldToValueMap: {},
  matchedRowValueMap: {},
  columnsInError: {},
  rowsInError: {},
  workingSheetName: '',
  workingRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resolveRow,
      filterRow,
      acceptRowMatches,
      removeRowMatch,
    },
    dispatch,
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResolveRow);
