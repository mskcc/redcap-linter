import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ResolvedRequiredErrors from './ResolvedRequiredErrors/ResolvedRequiredErrors';
import RequiredResolver from './RequiredResolver/RequiredResolver';
import './MissingRequired.scss';
import { resolveRow, filterRow, updateValue } from '../../actions/RedcapLinterActions';

class MissingRequired extends Component {
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
      recordsMissingRequiredData,
      csvHeaders,
      resolveRow,
    } = this.props;
    const payload = {
      jsonData,
      fieldToValueMap,
      projectInfo,
      workingRow,
      workingSheetName,
      recordsMissingRequiredData,
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
      projectInfo,
      ddData,
      csvHeaders,
      recordsMissingRequiredData,
      resolveRow,
    } = this.props;
    const payload = {
      jsonData,
      fieldToValueMap,
      projectInfo,
      workingRow,
      workingSheetName,
      recordsMissingRequiredData,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    resolveRow(payload);
  }

  render() {
    const {
      jsonData,
      recordsMissingRequiredData,
      fieldToValueMap,
      updateValue,
      workingSheetName,
      workingRow,
      csvHeaders,
      filterRow,
      ddData
    } = this.props;

    // TODO take workingSheetName from props
    const workingSheet = workingSheetName || Object.keys(recordsMissingRequiredData)[0];
    const sheetHeaders = csvHeaders[workingSheet];
    const workingRowNum = workingRow || recordsMissingRequiredData[workingSheet][0];
    const row = jsonData[workingSheet][workingRowNum];

    let requiredDdFields = ddData.reduce((filtered, field) => {
      if (field.required) {
        filtered.push(field.field_name);
      }
      return filtered;
    }, []);

    let rowData = sheetHeaders.reduce((filtered, field) => {
      if (requiredDdFields.indexOf(field) === -1) {
        filtered.push({
          'Field': field,
          'Value': row[field],
        });
      }
      return filtered;
    }, []);

    Object.keys(fieldToValueMap).forEach((field) => {
      rowData.unshift({
        'Field': field,
        'Value': fieldToValueMap[field],
      })
    });

    // <button type="button" onClick={e => this.handleSkip(field, e)} className="MissingRequired-skipButton">Skip</button>

    return (
      <div>
        <div className="MissingRequired-container">
          <div className="MissingRequired-matchedChoices">
            <div className="MissingRequired-title">Row Data</div>
            <ResolvedRequiredErrors
              fieldToValueMap={fieldToValueMap}
              updateValue={this.props.updateValue}
              tableData={rowData}
              sheet={workingSheet}
              rowNum={workingRowNum+1}
              filterRow={filterRow}
            />
          </div>
          <div className="MissingRequired-unmatchedChoices">
            <div className="MissingRequired-title">Missing Required Values</div>
            <RequiredResolver
              row={row}
              rowNum={workingRowNum}
              sheet={workingSheet}
              requiredDdFields={requiredDdFields}
            />
          </div>
        </div>
        <div className="MissingRequired-saveAndContinue">
          <button type="button" onClick={this.saveChanges.bind(this)} className="MissingRequired-save">Save</button>
          <button type="button" onClick={this.saveAndContinue.bind(this)} className="App-submitButton">Save and Continue</button>
        </div>
      </div>
    );
  }
}

MissingRequired.propTypes = {
  noMissingRequired: PropTypes.array,
  fieldToValueMap: PropTypes.object,
};

MissingRequired.defaultProps = {
  noMissingRequired: [],
  fieldToValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveRow, filterRow, updateValue }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MissingRequired);
