import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ResolvedTextErrors from './ResolvedTextErrors/ResolvedTextErrors';
import TextErrorResolver from './TextErrorResolver/TextErrorResolver';
import ErrorSelector from '../ErrorSelector/ErrorSelector';
import './TextValidation.scss';
import { resolveColumn, filterTable, removeValueMatch } from '../../actions/RedcapLinterActions';

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
      columnsInError,
      resolveColumn,
      filterTable,
    } = this.props;
    const payload = {
      jsonData,
      originalToCorrectedValueMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      ddData,
      columnsInError,
      csvHeaders,
      action: 'save',
    };
    filterTable('');
    resolveColumn(payload);
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
      filterTable,
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
      action: 'continue',
    };
    filterTable('');
    resolveColumn(payload);
  }

  render() {
    const {
      originalToCorrectedValueMap,
      workingSheetName,
      workingColumn,
      removeValueMatch,
    } = this.props;

    if (!workingColumn) {
      return null;
    }

    let correctedValues = [];
    if (originalToCorrectedValueMap[workingSheetName] && originalToCorrectedValueMap[workingSheetName][workingColumn]) {
      const valueMap = originalToCorrectedValueMap[workingSheetName][workingColumn];
      correctedValues = Object.keys(valueMap).map(originalValue => ({
        'Original Value': originalValue,
        'Corrected Value': valueMap[originalValue],
      }));
    }

    return (
      <div>
        <div className="TextValidation-column">
          <b>Choose Column or Row to Resolve</b>
          <ErrorSelector />
        </div>
        <div className="TextValidation-container">
          <div>
            <div className="TextValidation-matchedChoices">
              <div className="TextValidation-title">Corrected Values</div>
              <ResolvedTextErrors
                removeValueMatch={removeValueMatch}
                tableData={correctedValues}
              />
            </div>
            <div className="TextValidation-unmatchedChoices">
              <div className="TextValidation-title">Values in Error</div>
              <TextErrorResolver />
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="TextValidation-saveAndContinue">
            <button type="button" onClick={this.saveChanges.bind(this)} className="TextValidation-save">Save</button>
            <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">Save and Continue</button>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

TextValidation.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
  originalToCorrectedValueMap: PropTypes.object,
};

TextValidation.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, filterTable, removeValueMatch }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TextValidation);
