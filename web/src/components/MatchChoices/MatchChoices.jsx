import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import MatchedChoices from './MatchedChoices/MatchedChoices';
import ChoiceMatcher from './ChoiceMatcher/ChoiceMatcher';
import ActionMenu from '../ActionMenu/ActionMenu';
import './MatchChoices.scss';
import { removeChoiceMatch } from '../../actions/REDCapLinterActions';
import { resolveColumn } from '../../actions/ResolveActions';

class MatchChoices extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  saveChanges(e) {
    const {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      ddData,
      workingColumn,
      workingSheetName,
      malformedSheets,
      columnsInError,
      rowsInError,
      csvHeaders,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      malformedSheets,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action: 'save',
    };
    resolveColumn(payload);
  }

  saveAndContinue(e) {
    const {
      jsonData,
      dataFieldToChoiceMap,
      workingColumn,
      workingSheetName,
      malformedSheets,
      projectInfo,
      ddData,
      csvHeaders,
      decodedRecords,
      columnsInError,
      rowsInError,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      malformedSheets,
      decodedRecords,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    resolveColumn(payload);
  }

  render() {
    const {
      fieldErrors,
      dataFieldToChoiceMap,
      workingSheetName,
      workingColumn,
      removeChoiceMatch,
    } = this.props;

    if (!workingColumn) {
      return null;
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

    return (
      <div>
        <ActionMenu />
        <div className="MatchChoices-container">
          <div>
            <div className="MatchChoices-matchedChoices">
              <div className="MatchChoices-title">Matched Choices</div>
              <MatchedChoices removeChoiceMatch={removeChoiceMatch} tableData={matchedChoices} />
            </div>
            <div className="MatchChoices-unmatchedChoices">
              <div className="MatchChoices-title">Unmatched Choices</div>
              <ChoiceMatcher />
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="MatchChoices-saveAndContinue">
            <button
              type="button"
              onClick={this.saveChanges.bind(this)}
              className="MatchChoices-save"
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

MatchChoices.propTypes = {
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  decodedRecords: PropTypes.objectOf(PropTypes.array),
  ddData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
};

MatchChoices.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  decodedRecords: {},
  ddData: [],
  jsonData: [],
  projectInfo: {},
  malformedSheets: [],
  csvHeaders: {},
  columnsInError: {},
  rowsInError: {},
  workingSheetName: '',
  workingColumn: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, removeChoiceMatch }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MatchChoices);
