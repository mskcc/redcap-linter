import React, { Component } from 'react';
import './ErrorSelector.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { navigateTo } from '../../actions/REDCapLinterActions';
import { resolveColumn, resolveRow, resolveMergeRow } from '../../actions/ResolveActions';

class ErrorSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workingColumn: '',
      workingSheetName: '',
    };
    this.changeResolve = this.changeResolve.bind(this);
    this.changeMergeResolve = this.changeMergeResolve.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { workingColumn, workingSheetName } = prevState;
    if (
      nextProps.workingColumn !== workingColumn
      || nextProps.workingSheetName !== workingSheetName
    ) {
      return {
        workingColumn: nextProps.workingColumn,
        workingSheetName: nextProps.workingSheetName,
      };
    }
    return null;
  }

  changeResolve(e) {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      rowsInError,
      columnsInError,
      resolveRow,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      columnsInError,
      nextColumn: e.value.column,
      nextRow: e.value.rowNum,
      nextSheetName: e.value.sheet,
      rowsInError,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    if ('rowNum' in e.value) {
      resolveRow(payload);
    } else {
      resolveColumn(payload);
    }
  }

  changeMergeResolve(e) {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      mergeConflicts,
      resolveMergeRow,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      mergeConflicts,
      nextMergeRow: e.value.rowNum,
      nextSheetName: e.value.sheet,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    resolveMergeRow(payload);
  }

  goTo(page) {
    const { navigateTo } = this.props;
    navigateTo(page);
  }

  render() {
    const {
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      fieldToValueMap,
      rowsInError,
      columnsInError,
      mergeConflicts,
      workingSheetName,
      workingMergeRow,
      workingColumn,
      workingRow,
      page,
    } = this.props;

    const options = [];
    const mergeConflictOptions = [];

    let allErrors = [];
    Object.keys(columnsInError).forEach((sheet) => {
      const subOptions = [];
      columnsInError[sheet].forEach((columnInError) => {
        subOptions.push({
          value: { sheet, column: columnInError },
          label: columnInError,
        });
      });
      const choiceMap = dataFieldToChoiceMap[sheet] || {};
      Object.keys(choiceMap).reduce((filtered, column) => {
        if (!columnsInError[sheet].includes(column)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet, column },
            label: column,
            color: '#237804',
          });
        }
        return filtered;
      }, subOptions);

      const valueMap = originalToCorrectedValueMap[sheet] || {};
      Object.keys(valueMap).reduce((filtered, column) => {
        if (!columnsInError[sheet].includes(column)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet, column },
            label: column,
            color: '#237804',
          });
        }
        return filtered;
      }, subOptions);

      options.push({
        label: `${sheet} | Column Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(columnsInError[sheet]);
    });

    Object.keys(rowsInError).forEach((sheet) => {
      const subOptions = [];
      rowsInError[sheet].forEach((rowNumber) => {
        subOptions.push({
          value: { sheet, rowNum: rowNumber },
          label: rowNumber + 2,
        });
      });
      const valueMap = fieldToValueMap[sheet] || {};
      Object.keys(valueMap).reduce((filtered, row) => {
        const rowNum = Number(row);
        if (!rowsInError[sheet].includes(rowNum)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet, rowNum },
            label: rowNum + 2,
            color: '#237804',
          });
        }
        return filtered;
      }, subOptions);
      options.push({
        label: `${sheet} | Row Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(rowsInError[sheet]);
    });

    Object.keys(mergeConflicts).forEach((sheet) => {
      const subOptions = [];
      Object.keys(mergeConflicts[sheet]).forEach((row) => {
        const rowNum = Number(row);
        subOptions.push({
          value: { sheet, rowNum },
          label: rowNum + 2,
        });
      });
      mergeConflictOptions.push({
        label: `${sheet} | Merge Conflicts`,
        options: subOptions,
      });
    });

    let selectedValue = {};
    let selectedMergeValue = {};
    if (workingColumn) {
      selectedValue = {
        value: { sheet: workingSheetName, column: workingColumn },
        label: workingColumn,
      };
    } else if (workingRow >= 0) {
      selectedValue = {
        value: { sheet: workingSheetName, rowNum: workingRow },
        label: workingRow + 2,
      };
    } else if (workingMergeRow >= 0) {
      selectedMergeValue = {
        value: { sheet: workingSheetName, rowNum: workingMergeRow },
        label: workingMergeRow + 2,
      };
    }

    const longestOption = allErrors.sort((a, b) => b.length - a.length)[0];
    const selectWidth = 8 * longestOption + 60;

    const selectStyles = {
      control: provided => ({
        ...provided,
        minWidth: `${selectWidth}px`,
      }),
      menu: provided => ({
        // none of react-select's styles are passed to <Control />
        ...provided,
        minWidth: `${selectWidth}px`,
      }),
      option: (styles, { data }) => ({
        ...styles,
        color: data.color,
      }),
    };

    let errorSelector = '';
    if (page === 'lint' && options.length > 1) {
      errorSelector = (
        <div className="ErrorSelector-selector">
          <div className="ErrorSelector-label">
            <b>Choose Column or Row</b>
          </div>
          <div className="ErrorSelector-select">
            <div className="ErrorSelector-sheetName">{workingSheetName}</div>
            <Select
              className="ErrorSelector-elevate"
              options={options}
              isSearchable
              value={selectedValue}
              styles={selectStyles}
              onChange={this.changeResolve}
            />
          </div>
        </div>
      );
    } else if (page === 'merge' && mergeConflictOptions.length > 1) {
      errorSelector = (
        <div className="ErrorSelector-selector">
          <div className="ErrorSelector-label">
            <b>Choose Row</b>
          </div>
          <div className="ErrorSelector-select">
            <div className="ErrorSelector-sheetName">{workingSheetName}</div>
            <Select
              className="ErrorSelector-elevate"
              options={mergeConflictOptions}
              isSearchable
              value={selectedMergeValue}
              styles={selectStyles}
              onChange={this.changeMergeResolve}
            />
          </div>
        </div>
      );
    }

    return <div className="ErrorSelector-column">{errorSelector}</div>;
  }
}

ErrorSelector.propTypes = {
  ddData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  fieldToValueMap: PropTypes.objectOf(PropTypes.object),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  mergeConflicts: PropTypes.objectOf(PropTypes.object),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
  workingRow: PropTypes.number,
  workingMergeRow: PropTypes.number,
  page: PropTypes.string,
};

ErrorSelector.defaultProps = {
  ddData: [],
  jsonData: {},
  csvHeaders: {},
  projectInfo: {},
  columnsInError: {},
  rowsInError: {},
  mergeConflicts: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
  fieldToValueMap: {},
  workingSheetName: '',
  workingColumn: '',
  workingRow: -1,
  workingMergeRow: -1,
  page: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      resolveColumn,
      resolveRow,
      resolveMergeRow,
      navigateTo,
    },
    dispatch,
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ErrorSelector);
