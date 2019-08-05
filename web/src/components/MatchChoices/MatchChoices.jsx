import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon, Modal, Spin } from 'antd';
import PropTypes from 'prop-types';
import _ from 'lodash';
import MatchedChoices from './MatchedChoices/MatchedChoices';
import ChoiceMatcher from './ChoiceMatcher/ChoiceMatcher';
import ActionMenu from '../ActionMenu/ActionMenu';
import './MatchChoices.scss';
import '../../App.scss';
import ButtonMenu from '../ButtonMenu/ButtonMenu';
import { removeChoiceMatch, highlightChoices, navigateTo } from '../../actions/REDCapLinterActions';
import { resolveColumn } from '../../actions/ResolveActions';
import { getNextColumn } from '../../utils/utils';

class MatchChoices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      loadingSave: false,
      loadingContinue: false,
      nextSheetName: '',
      nextColumn: '',
    };

    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
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
      dataFieldToChoiceMap,
      projectInfo,
      matchedChoiceMap,
      ddData,
      workingColumn,
      workingSheetName,
      columnsInError,
      rowsInError,
      csvHeaders,
      resolveColumn,
    } = this.props;

    const { nextSheetName, nextColumn, nextRow } = this.state;

    const ddField = ddData.find(field => field.field_name === workingColumn);

    let unsavedChoiceMap = {};
    if (matchedChoiceMap[workingSheetName] && matchedChoiceMap[workingSheetName][workingColumn]) {
      unsavedChoiceMap = matchedChoiceMap[workingSheetName][workingColumn];
    }
    if (
      action === 'continue'
      && Object.keys(unsavedChoiceMap).length > 0
      && ddField.field_type !== 'checkbox'
    ) {
      this.setState({ showModal: true });
      return;
    }
    const payload = {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      nextSheetName,
      nextColumn,
      nextRow,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action,
    };
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

  forward() {
    const { navigateTo } = this.props;
    navigateTo('merge');
  }

  back() {
    const { navigateTo } = this.props;
    navigateTo('matchFields');
  }

  render() {
    const { showModal, loadingSave, loadingContinue } = this.state;
    const {
      fieldErrors,
      matchedChoiceMap,
      dataFieldToRedcapFieldMap,
      dataFieldToChoiceMap,
      workingSheetName,
      workingColumn,
      columnsInError,
      rowsInError,
      removeChoiceMatch,
    } = this.props;

    const { nextSheetName, nextColumn } = this.state;

    if (!workingColumn) {
      return null;
    }

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

    let unsavedChoiceMap = {};
    if (matchedChoiceMap[workingSheetName] && matchedChoiceMap[workingSheetName][workingColumn]) {
      unsavedChoiceMap = matchedChoiceMap[workingSheetName][workingColumn];
    }
    let matchedChoices = fieldErrors.matchedChoices || [];
    let choiceMap = {};
    if (
      dataFieldToChoiceMap[workingSheetName]
      && dataFieldToChoiceMap[workingSheetName][workingColumn]
    ) {
      choiceMap = dataFieldToChoiceMap[workingSheetName][workingColumn];
    }
    matchedChoices = matchedChoices.map(header => ({
      'Data Field': header,
      'Permissible Value': header,
    }));
    matchedChoices = matchedChoices.concat(
      Object.keys(choiceMap).reduce((filtered, dataField) => {
        if (choiceMap[dataField]) {
          filtered.push({
            'Data Field': dataField,
            'Permissible Value': choiceMap[dataField],
          });
        }
        return filtered;
      }, []),
    );
    matchedChoices = matchedChoices.concat(
      Object.keys(choiceMap).reduce((filtered, dataField) => {
        if (!choiceMap[dataField]) {
          filtered.push({
            'Data Field': dataField,
            'Permissible Value': choiceMap[dataField],
          });
        }
        return filtered;
      }, []),
    );

    let saveButtonText = 'Save';
    if (loadingSave) {
      saveButtonText = <Spin />;
    }

    let continueButtonText = 'Save and Continue';
    if (loadingContinue) {
      continueButtonText = <Spin />;
    }
    const choiceMatcher = <ChoiceMatcher showModal={showModal} />;
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
        <div className="MatchChoices-navigation">
          <div className="MatchChoices-header">
            <div className="MatchChoices-columnDetails">
              <b>Sheet</b>
              {`: ${workingSheetName}`}
              <br />
              <b>Column</b>
              {` : ${current}`}
            </div>

            <div className="MatchChoices-progress">
              <b>Remaining Columns</b>
              {`: ${remainingColumns}`}
              <br />
              <b>Remaining Rows</b>
              {`: ${remainingRows}`}
            </div>
            {nextItemToResolve}
          </div>
          <ButtonMenu />
          <div className="MatchChoices-navigationButtons">
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
        <div className="MatchChoices-container">
          <div className="MatchChoices-nextColumn">{lastColumnText}</div>
          <div>
            <div className="MatchChoices-matchedChoices">
              <div className="MatchChoices-title">Matched Choices</div>
              <MatchedChoices removeChoiceMatch={removeChoiceMatch} tableData={matchedChoices} />
            </div>
            <div className="MatchChoices-unmatchedChoices">
              <div className="MatchChoices-title">Unmatched Choices</div>
              {choiceMatcher}
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="MatchChoices-saveAndContinue">
            <button
              type="button"
              onClick={() => {
                this.saveChanges('save');
              }}
              className="App-actionButton"
            >
              {saveButtonText}
            </button>
            <button
              type="button"
              id="unmatchedChoicesSaveAndContinue"
              onClick={() => {
                this.saveChanges('continue');
              }}
              className="App-submitButton"
            >
              {continueButtonText}
            </button>
            <Modal
              title="Confirm Choices"
              width={800}
              visible={showModal}
              onOk={() => {
                this.handleOk();
              }}
              okButtonProps={{ disabled: Object.keys(unsavedChoiceMap).length > 0 }}
              onCancel={() => {
                this.handleCancel();
              }}
            >
              <p>You have unaccepted matches. Would you like to Accept or Reject these matches?</p>
              {choiceMatcher}
            </Modal>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

MatchChoices.propTypes = {
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  ddData: PropTypes.arrayOf(PropTypes.object),
  matchedChoiceMap: PropTypes.objectOf(PropTypes.any),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
  loadingResolve: PropTypes.bool,
};

MatchChoices.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  dataFieldToRedcapFieldMap: {},
  ddData: [],
  matchedChoiceMap: {},
  jsonData: [],
  projectInfo: {},
  csvHeaders: {},
  columnsInError: {},
  rowsInError: {},
  workingSheetName: '',
  workingColumn: '',
  loadingResolve: false,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resolveColumn,
      removeChoiceMatch,
      highlightChoices,
      navigateTo,
    },
    dispatch,
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MatchChoices);
