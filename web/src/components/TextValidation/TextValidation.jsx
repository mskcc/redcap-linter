import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
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
      originalToCorrectedValueMap,
      projectInfo,
      ddData,
      workingColumn,
      workingSheetName,
      csvHeaders,
      saveChoices,
    } = this.props;
    const payload = {
      jsonData,
      originalToCorrectedValueMap,
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
      originalToCorrectedValueMap,
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
      originalToCorrectedValueMap,
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
      originalToCorrectedValueMap,
    } = this.props;
    // const noTextValidation = fieldErrors.noTextValidation || [];
    let correctedValues = [];
    if (originalToCorrectedValueMap) {
      correctedValues = Object.keys(originalToCorrectedValueMap).map(originalValue => ({
        'Original Value': originalValue,
        'Corrected Value': originalToCorrectedValueMap[originalValue],
      }));
    }
    // correctedValues = correctedValues.concat(noTextValidation.map(dataField => ({
    //   'Original Value': dataField,
    //   'Corrected Value': '',
    // })));

    return (
      <div className="TextValidation-container">
        <div className="TextValidation-matchedChoices">
          <div className="TextValidation-title">Corrected Values</div>
          <ResolvedTextErrors
            tableData={correctedValues}
          />
        </div>
        <div className="TextValidation-unmatchedChoices">
          <div className="TextValidation-title">Values in Error</div>
          <TextErrorResolver />
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
