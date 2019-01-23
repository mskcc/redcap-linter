import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'react-tabs/style/react-tabs.css';
import PropTypes from 'prop-types';
import ResolvedTextErrors from './ResolvedTextErrors/ResolvedTextErrors';
import TextErrorResolver from './TextErrorResolver/TextErrorResolver';
import './TextValidation.scss';
import { saveChoices, resolveColumn } from '../../actions/RedcapLinterActions';

class TextValidation extends Component {
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
    const noTextValidation = fieldErrors.noTextValidation || [];
    let matchedChoices = fieldErrors.matchedChoices || [];
    matchedChoices = matchedChoices.map(header => ({
      'Data Field': header,
      'Permissible Value': header,
    }));
    matchedChoices = matchedChoices.concat(Object.keys(dataFieldToChoiceMap).map(dataField => ({
      'Data Field': dataField,
      'Permissible Value': dataFieldToChoiceMap[dataField],
    })));
    matchedChoices = matchedChoices.concat(noTextValidation.map(dataField => ({
      'Data Field': dataField,
      'Permissible Value': '',
    })));

    return (
      <div className="TextValidation-container">
        <div className="TextValidation-matchedChoices">
          <div className="TextValidation-title">Corrected Values</div>
          <ResolvedTextErrors
            tableData={matchedChoices}
          />
        </div>
        <div className="TextValidation-unmatchedChoices">
          <div className="TextValidation-title">Values in Error</div>
          <TextErrorResolver
            fieldsToMatch={fieldErrors.unmatchedChoices}
            fieldCandidates={fieldErrors.choiceCandidates}
          />
        </div>
        <div className="TextValidation-saveAndContinue">
          <button type="button" onClick={this.saveChanges.bind(this)} className="TextValidation-save">Save</button>
          <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">Save and Continue</button>
        </div>
      </div>
    );
  }
}

TextValidation.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
  noTextValidation: PropTypes.array,
};

TextValidation.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  noTextValidation: [],
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveChoices, resolveColumn }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TextValidation);
