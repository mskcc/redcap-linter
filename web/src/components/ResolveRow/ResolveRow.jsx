import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ResolvedRowErrors from './ResolvedRowErrors/ResolvedRowErrors';
import RowResolver from './RowResolver/RowResolver';
import ActionMenu from '../ActionMenu/ActionMenu';
import './ResolveRow.scss';
import { filterRow, acceptRowMatches } from '../../actions/REDCapLinterActions';
import { resolveRow } from '../../actions/ResolveActions';

class ResolveRow extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  saveChanges(action) {
    const {
      jsonData,
      fieldToValueMap,
      projectInfo,
      ddData,
      workingRow,
      workingSheetName,
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
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action,
    };

    resolveRow(payload);
  }

  render() {
    const {
      jsonData,
      cellsWithErrors,
      fieldToValueMap,
      workingSheetName,
      workingRow,
      csvHeaders,
      acceptRowMatches,
      filterRow,
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
      if (!currentRowErrors[field] && !valueMap[field]) {
        filtered.push({
          Field: field,
          Value: row[field] || '',
        });
      }
      return filtered;
    }, []);

    Object.keys(valueMap).forEach((field) => {
      if (valueMap[field]) {
        tableData.unshift({
          Field: field,
          Value: valueMap[field],
        });
      }
    });

    return (
      <div>
        <ActionMenu />
        <div className="ResolveRow-container">
          <div>
            <div className="ResolveRow-matchedChoices">
              <div className="ResolveRow-title">Row Data</div>
              <ResolvedRowErrors
                fieldToValueMap={fieldToValueMap}
                acceptRowMatches={acceptRowMatches}
                tableData={tableData}
                workingSheetName={workingSheetName}
                workingRow={workingRow}
              />
            </div>
            <div className="ResolveRow-unmatchedChoices">
              <div className="ResolveRow-title">Row Errors</div>
              <RowResolver />
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="ResolveRow-saveAndContinue">
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'save')}
              className="App-actionButton"
            >
              Save
            </button>
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'continue')}
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

ResolveRow.propTypes = {
  fieldToValueMap: PropTypes.objectOf(PropTypes.object),
  ddData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingRow: PropTypes.number,
};

ResolveRow.defaultProps = {
  ddData: [],
  projectInfo: {},
  jsonData: {},
  csvHeaders: {},
  cellsWithErrors: {},
  fieldToValueMap: {},
  columnsInError: {},
  rowsInError: {},
  workingSheetName: '',
  workingRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveRow, filterRow, acceptRowMatches }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResolveRow);
