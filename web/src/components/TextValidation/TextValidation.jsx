import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Modal, Spin, Icon } from 'antd';
import ResolvedTextErrors from './ResolvedTextErrors/ResolvedTextErrors';
import TextErrorResolver from './TextErrorResolver/TextErrorResolver';
import ActionMenu from '../ActionMenu/ActionMenu';
import './TextValidation.scss';
import ButtonMenu from '../ButtonMenu/ButtonMenu';
import { filterTable, removeValueMatch, navigateTo } from '../../actions/REDCapLinterActions';
import { resolveColumn } from '../../actions/ResolveActions';
import { isValueValid, getNextColumn } from '../../utils/utils';

class TextValidation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      loadingSave: false,
      loadingContinue: false,
    };

    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.forward = this.forward.bind(this);
    this.back = this.back.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { columnsInError, workingSheetName, workingColumn } = nextProps;
    const next = getNextColumn(columnsInError, workingSheetName, workingColumn);

    const { nextSheetName, nextColumn } = next;

    const { loadingResolve } = nextProps;
    if (!loadingResolve) {
      return {
        loadingSave: false,
        loadingContinue: false,
        nextSheetName,
        nextColumn,
      };
    }
    return null;
  }

  saveChanges(action) {
    const {
      jsonData,
      originalToCorrectedValueMap,
      matchedValueMap,
      projectInfo,
      ddData,
      workingColumn,
      workingSheetName,
      csvHeaders,
      columnsInError,
      rowsInError,
      fieldErrors,
      resolveColumn,
      filterTable,
    } = this.props;

    const { nextSheetName, nextColumn, nextRow } = this.state;

    const validValues = [];
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      // TODO only check for valid values
      Object.values(matchedValueMap[workingSheetName][workingColumn]).forEach((value) => {
        if (isValueValid(value, fieldErrors)) {
          validValues.push(value);
        }
      });
    }
    if (action === 'continue' && validValues.length > 0) {
      this.setState({ showModal: true });
      return;
    }
    const payload = {
      jsonData,
      originalToCorrectedValueMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      nextSheetName,
      nextColumn,
      nextRow,
      ddData,
      columnsInError,
      rowsInError,
      csvHeaders,
      action,
    };
    filterTable('');
    resolveColumn(payload);
    if (action === 'save') {
      this.setState({ loadingSave: true });
    } else if (action === 'continue') {
      this.setState({ loadingContinue: true });
    }
  }

  forward() {
    const { navigateTo } = this.props;
    navigateTo('merge');
  }

  back() {
    const { navigateTo } = this.props;
    navigateTo('matchFields');
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
    const { loadingSave, loadingContinue, showModal } = this.state;
    const {
      originalToCorrectedValueMap,
      dataFieldToRedcapFieldMap,
      workingSheetName,
      workingColumn,
      columnsInError,
      rowsInError,
      matchedValueMap,
      removeValueMatch,
    } = this.props;

    if (!workingColumn) {
      return null;
    }

    const { nextSheetName, nextColumn } = this.state;

    let remainingColumns = 0;
    let remainingRows = 0;

    Object.keys(columnsInError).forEach((sheet) => {
      if (columnsInError[sheet] && columnsInError[sheet].length > 0) {
        remainingColumns += columnsInError[sheet].length;
      }
    });

    Object.keys(rowsInError).forEach((sheet) => {
      if (rowsInError[sheet] && rowsInError[sheet].length > 0) {
        remainingRows += rowsInError[sheet].length;
      }
    });

    let unsavedValueMap = {};
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      unsavedValueMap = matchedValueMap[workingSheetName][workingColumn];
    }

    let correctedValues = [];
    if (
      originalToCorrectedValueMap[workingSheetName]
      && originalToCorrectedValueMap[workingSheetName][workingColumn]
    ) {
      const valueMap = originalToCorrectedValueMap[workingSheetName][workingColumn];
      correctedValues = Object.keys(valueMap).map(originalValue => ({
        'Original Value': originalValue,
        'Corrected Value': valueMap[originalValue],
      }));
    }

    let saveButtonText = 'Save';
    if (loadingSave) {
      saveButtonText = <Spin />;
    }

    let continueButtonText = 'Save and Continue';
    if (loadingContinue) {
      continueButtonText = <Spin />;
    }
    const textErrorResolver = <TextErrorResolver showModal={showModal} />;
    let current = workingColumn;
    let next = nextColumn;
    if (dataFieldToRedcapFieldMap[workingSheetName]) {
      current = _.invert(dataFieldToRedcapFieldMap[workingSheetName])[workingColumn];
      next = _.invert(dataFieldToRedcapFieldMap[workingSheetName])[nextColumn];
    }

    let nextItemToResolve = '';
    let lastColumnText = '';
    if (remainingColumns === 1) {
      lastColumnText = 'This is the last column to resolve. If there are rows missing required values the next step will be to assign values. If not the next step will be to merge with records in REDCap.';
    } else if (nextColumn) {
      nextItemToResolve = (
        <div className="TextValidation-next">
          <b>Next Sheet</b>
          {`: ${nextSheetName}`}
          <br />
          <b>Next Column</b>
          {`: ${next}`}
        </div>
      );
    }

    return (
      <div>
        <div className="TextValidation-navigation">
          <div className="TextValidation-header">
            <div className="TextValidation-columnDetails">
              <b>Sheet</b>
              {`: ${workingSheetName}`}
              <br />
              <b>Column</b>
              {` : ${current}`}
            </div>

            <div className="TextValidation-progress">
              <b>Remaining Columns</b>
              {`: ${remainingColumns}`}
              <br />
              <b>Remaining Rows</b>
              {`: ${remainingRows}`}
            </div>
            {nextItemToResolve}
          </div>
          <ButtonMenu />
          <div className="TextValidation-navigationButtons">
            <button
              type="button"
              onClick={() => {
                this.back();
              }}
              className="App-actionButton"
            >
              <Icon type="left" />
              {' Match Fields'}
            </button>
            <button
              type="button"
              id="forward"
              onClick={() => {
                this.forward();
              }}
              className="App-actionButton"
            >
              {'Merge '}
              <Icon type="right" />
            </button>
          </div>
        </div>
        <ActionMenu />
        <div className="TextValidation-container">
          <div className="TextValidation-nextColumn">{lastColumnText}</div>
          <div>
            <div className="TextValidation-matchedChoices">
              <div className="TextValidation-title">Corrected Values</div>
              <ResolvedTextErrors removeValueMatch={removeValueMatch} tableData={correctedValues} />
            </div>
            <div className="TextValidation-unmatchedChoices">
              <div className="TextValidation-title">Values in Error</div>
              {textErrorResolver}
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="TextValidation-saveAndContinue">
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'save')}
              className="App-actionButton"
            >
              {saveButtonText}
            </button>
            <button
              type="button"
              id="textValidationSaveAndContinue"
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
              {textErrorResolver}
            </Modal>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

TextValidation.propTypes = {
  ddData: PropTypes.arrayOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.array),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  matchedValueMap: PropTypes.objectOf(PropTypes.any),
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
};

TextValidation.defaultProps = {
  ddData: [],
  jsonData: [],
  projectInfo: {},
  csvHeaders: {},
  columnsInError: {},
  rowsInError: {},
  dataFieldToRedcapFieldMap: {},
  originalToCorrectedValueMap: {},
  matchedValueMap: {},
  fieldErrors: {},
  workingSheetName: '',
  workingColumn: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resolveColumn,
      filterTable,
      removeValueMatch,
      navigateTo,
    },
    dispatch,
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TextValidation);
