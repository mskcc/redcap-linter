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
import { isValueValid } from '../../utils/utils';

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
      fieldErrors,
      resolveColumn,
      filterTable,
    } = this.props;
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
    const textErrorResolver = <TextErrorResolver showModal={showModal} />;
    let column = workingColumn;
    if (dataFieldToRedcapFieldMap[workingSheetName]) {
      column = _.invert(dataFieldToRedcapFieldMap[workingSheetName])[workingColumn];
    }
    return (
      <div>
        <div className="TextValidation-navigation">
          <div className="MatchChoices-header">
            <b>Sheet</b>
            {`: ${workingSheetName} | `}
            <b>Column</b>
            {` : ${column}`}
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
              {' Back to Match Fields'}
            </button>
            <button
              type="button"
              onClick={() => {
                this.forward();
              }}
              className="App-actionButton"
            >
              {'Continue to Merging '}
              <Icon type="right" />
            </button>
          </div>
        </div>
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
