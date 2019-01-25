import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import MatchedChoices from './MatchedChoices/MatchedChoices';
import ChoiceMatcher from './ChoiceMatcher/ChoiceMatcher';
import './MatchChoices.scss';
import { saveChoices, resolveColumn } from '../../actions/RedcapLinterActions';

class MatchChoices extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  saveChanges(e) {
    const {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      ddData,
      workingColumn,
      workingSheetName,
      csvHeaders,
      saveChoices,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      ddData,
      csvHeaders,
    };
    saveChoices(payload);
  }

  saveAndContinue(e) {
    const {
      jsonData,
      dataFieldToChoiceMap,
      workingColumn,
      workingSheetName,
      projectInfo,
      ddData,
      csvHeaders,
      columnsInError,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      columnsInError,
      ddData,
      csvHeaders,
    };
    resolveColumn(payload);
  }

  render() {
    const {
      fieldErrors,
      dataFieldToChoiceMap,
    } = this.props;
    let matchedChoices = fieldErrors.matchedChoices || [];
    matchedChoices = matchedChoices.map(header => ({
      'Data Field': header,
      'Permissible Value': header,
    }));
    matchedChoices = matchedChoices.concat(Object.keys(dataFieldToChoiceMap).reduce((filtered, dataField) => {
      if (dataFieldToChoiceMap[dataField]) {
        filtered.push({
          'Data Field': dataField,
          'Permissible Value': dataFieldToChoiceMap[dataField],
        });
      }
      return filtered;
    }, []));
    matchedChoices = matchedChoices.concat(Object.keys(dataFieldToChoiceMap).reduce((filtered, dataField) => {
      if (!dataFieldToChoiceMap[dataField]) {
        filtered.push({
          'Data Field': dataField,
          'Permissible Value': dataFieldToChoiceMap[dataField],
        });
      }
      return filtered;
    }, []));

    return (
      <div className="MatchChoices-container">
        <div className="MatchChoices-matchedChoices">
          <div className="MatchChoices-title">Matched Choices</div>
          <MatchedChoices
            tableData={matchedChoices}
          />
        </div>
        <div className="MatchChoices-unmatchedChoices">
          <div className="MatchChoices-title">Unmatched Choices</div>
          <ChoiceMatcher
            fieldsToMatch={fieldErrors.unmatchedChoices}
            fieldCandidates={fieldErrors.choiceCandidates}
          />
        </div>
        <div className="MatchChoices-saveAndContinue">
          <button type="button" onClick={this.saveChanges.bind(this)} className="MatchChoices-save">Save</button>
          <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">Save and Continue</button>
        </div>
      </div>
    );
  }
}

MatchChoices.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
};

MatchChoices.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveChoices, resolveColumn }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchChoices);
