import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ResolvedRowErrors from './ResolvedRowErrors/ResolvedRowErrors';
import RowResolver from './RowResolver/RowResolver';
import ActionMenu from '../ActionMenu/ActionMenu';
import './ResolveRow.scss';
import { resolveRow, filterRow, updateValue } from '../../actions/RedcapLinterActions';

class ResolveRow extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  saveChanges(e) {
    const {
      jsonData,
      fieldToValueMap,
      projectInfo,
      ddData,
      workingRow,
      workingSheetName,
      malformedSheets,
      columnsInError,
      rowsInError,
      csvHeaders,
      resolveRow,
    } = this.props;
    const payload = {
      jsonData,
      fieldToValueMap,
      projectInfo,
      workingRow,
      workingSheetName,
      malformedSheets,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action: 'save',
    };

    resolveRow(payload);
  }

  saveAndContinue(e) {
    const {
      jsonData,
      fieldToValueMap,
      workingRow,
      workingSheetName,
      malformedSheets,
      projectInfo,
      ddData,
      csvHeaders,
      columnsInError,
      rowsInError,
      resolveRow,
    } = this.props;
    const payload = {
      jsonData,
      fieldToValueMap,
      projectInfo,
      workingRow,
      workingSheetName,
      malformedSheets,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    resolveRow(payload);
  }

  render() {
    const {
      jsonData,
      cellsWithErrors,
      rowsInError,
      fieldToValueMap,
      updateValue,
      workingSheetName,
      workingRow,
      csvHeaders,
      filterRow,
      ddData,
    } = this.props;

    if (workingRow === -1 || workingRow === '') {
      return null;
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
      if (!currentRowErrors[field]) {
        filtered.push({
          'Field': field,
          'Value': row[field] || "",
        });
      }
      return filtered;
    }, []);

    Object.keys(valueMap).forEach((field) => {
      if (valueMap[field]) {
        tableData.unshift({
          'Field': field,
          'Value': valueMap[field],
        })
      }
    });

    // <button type="button" onClick={e => this.handleSkip(field, e)} className="MissingRequired-skipButton">Skip</button>

    return (
      <div>
        <ActionMenu />
        <div className="ResolveRow-container">
          <div>
            <div className="ResolveRow-matchedChoices">
              <div className="ResolveRow-title">Row Data</div>
              <ResolvedRowErrors
                fieldToValueMap={valueMap}
                updateValue={updateValue}
                tableData={tableData}
                workingSheetName={workingSheetName}
              />
            </div>
            <div className="ResolveRow-unmatchedChoices">
              <div className="ResolveRow-title">Row Errors</div>
              <RowResolver />
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="ResolveRow-saveAndContinue">
            <button type="button" onClick={this.saveChanges.bind(this)} className="ResolveRow-save">Save</button>
            <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">Save and Continue</button>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

ResolveRow.propTypes = {
  noMissingRequired: PropTypes.array,
  fieldToValueMap: PropTypes.object,
  workingRow: PropTypes.number,
};

ResolveRow.defaultProps = {
  noMissingRequired: [],
  fieldToValueMap: {},
  workingRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveRow, filterRow, updateValue }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ResolveRow);
