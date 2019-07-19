import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Modal, Spin } from 'antd';
import ResolvedTextErrors from './ResolvedTextErrors/ResolvedTextErrors';
import TextErrorResolver from './TextErrorResolver/TextErrorResolver';
import ActionMenu from '../ActionMenu/ActionMenu';
import './TextValidation.scss';
import { filterTable, removeValueMatch } from '../../actions/REDCapLinterActions';
import { resolveColumn } from '../../actions/ResolveActions';

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
    this.isValueValid = this.isValueValid.bind(this);
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
      originalToCorrectedValueMap,
      matchedValueMap,
      projectInfo,
      ddData,
      workingColumn,
      workingSheetName,
      csvHeaders,
      columnsInError,
      rowsInError,
      resolveColumn,
      filterTable,
    } = this.props;
    const validValues = [];
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      // TODO only check for valid values
      Object.values(matchedValueMap[workingSheetName][workingColumn]).forEach((value) => {
        if (this.isValueValid(value)) {
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

  handleOk() {
    this.saveChanges('continue');
    this.setState({ showModal: false });
  }

  handleCancel() {
    this.setState({
      showModal: false,
    });
  }

  isValueValid(value) {
    const { fieldErrors } = this.props;

    const { textValidation, textValidationMin, textValidationMax } = fieldErrors;

    let valid = true;
    if (textValidation === 'integer') {
      // https://stackoverflow.com/questions/1779013/check-if-string-contains-only-digits/1779019
      const integerRegex = /^[-+]?\d+$/;
      if (integerRegex.test(value)) {
        const parsedValue = parseInt(value, 10);
        if (
          (textValidationMin && parsedValue < parseInt(textValidationMin, 10))
          || (textValidationMax && parsedValue > parseInt(textValidationMax, 10))
        ) {
          valid = false;
        }
      } else {
        valid = false;
      }
    } else if (textValidation === 'number_2dp') {
      // https://stackoverflow.com/questions/1779013/check-if-string-contains-only-digits/1779019
      const decimalRegex = /^[-+]?\d+\.[0-9]{2}$/;
      if (decimalRegex.test(value)) {
        const parsedValue = parseFloat(value, 10);
        if (
          (textValidationMin && parsedValue < parseFloat(textValidationMin, 10))
          || (textValidationMax && parsedValue > parseFloat(textValidationMax, 10))
        ) {
          valid = false;
        }
      } else {
        valid = false;
      }
    }

    return valid;
  }

  render() {
    const { loadingSave, loadingContinue, showModal } = this.state;
    const {
      originalToCorrectedValueMap,
      workingSheetName,
      workingColumn,
      matchedValueMap,
      removeValueMatch,
    } = this.props;

    if (!workingColumn) {
      return null;
    }

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
    const textErrorResolver = (
      <TextErrorResolver isValueValid={this.isValueValid} showModal={showModal} />
    );
    return (
      <div>
        <ActionMenu />
        <div className="TextValidation-container">
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
  return bindActionCreators({ resolveColumn, filterTable, removeValueMatch }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TextValidation);
