import React, { Component } from 'react';
import './ErrorSelector.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { Menu, Icon, Button } from 'antd';
import { resolveColumn, resolveRow, navigateTo } from '../../actions/RedcapLinterActions';

class ErrorSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workingColumn: '',
      workingSheetName: '',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      workingColumn,
      workingSheetName,
    } = prevState;
    if (nextProps.workingColumn !== workingColumn || nextProps.workingSheetName !== workingSheetName) {
      return { workingColumn: nextProps.workingColumn, workingSheetName: nextProps.workingSheetName};
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

  goTo(page) {
    const {
      navigateTo,
    } = this.props;
    navigateTo(page);
  }

  render() {
    const {
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      fieldToValueMap,
      rowsInError,
      workingSheetName,
      workingColumn,
      workingRow,
      columnsInError,
      page,
    } = this.props;

    const options = [];
    let allErrors = [];
    Object.keys(columnsInError).forEach((sheet) => {
      const subOptions = [];
      columnsInError[sheet].forEach((columnInError) => {
        subOptions.push({
          value: { sheet: sheet, column: columnInError },
          label: columnInError,
        });
      });
      const choiceMap = dataFieldToChoiceMap[sheet] || {};
      Object.keys(choiceMap).reduce((filtered, column) => {
        if (!columnsInError[sheet].includes(column)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet: sheet, column: column },
            label: column,
            color: '#237804',
          })
        }
        return filtered;
      }, subOptions);

      const valueMap = originalToCorrectedValueMap[sheet] || {};
      Object.keys(valueMap).reduce((filtered, column) => {
        if (!columnsInError[sheet].includes(column)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet: sheet, column: column },
            label: column,
            color: '#237804',
          })
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
          value: { sheet: sheet, rowNum: rowNumber },
          label: rowNumber+2,
        });
      });
      const valueMap = fieldToValueMap[sheet] || {};
      Object.keys(valueMap).reduce((filtered, row) => {
        const rowNum = Number(row);
        if (!rowsInError[sheet].includes(rowNum)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet: sheet, rowNum: rowNum },
            label: rowNum + 2,
            color: '#237804',
          })
        }
        return filtered;
      }, subOptions);
      options.push({
        label: `${sheet} | Row Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(rowsInError[sheet]);
    });

    let selectedValue = {}
    if (workingColumn) {
      selectedValue = {
        value: { sheet: workingSheetName, column: workingColumn },
        label: workingColumn,
      };
    } else if (workingRow !== '') {
      selectedValue = {
        value: { sheet: workingSheetName, rowNum: workingRow },
        label: workingRow+2,
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
      option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
          ...styles,
          color: data.color,
        };
      },
    };

    let errorSelector = '';
    if (page === 'lint') {
      errorSelector = (<div className="ErrorSelector-selector">
        <div className="ErrorSelector-label">
          <b>Choose Column or Row</b>
        </div>
        <div className="ErrorSelector-select">
          <div className="ErrorSelector-sheetName">
            { workingSheetName }
          </div>
          <Select
            className="ErrorSelector-elevate"
            options={options}
            isSearchable
            value={selectedValue}
            styles={selectStyles}
            onChange={this.changeResolve.bind(this)}
          />
        </div>
      </div>);
    }

    return (
      <div className="ErrorSelector-column">
        { errorSelector }
      </div>
    );
  }
}

ErrorSelector.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
  noMatchRedcapFields: PropTypes.array,
  originalToCorrectedValueMap: PropTypes.object,
  columnsInError: PropTypes.object,
  rowsInError: PropTypes.object,
  fieldToValueMap: PropTypes.object,
};

ErrorSelector.defaultProps = {
  fieldErrors: {},
  columnsInError: {},
  rowsInError: {},
  dataFieldToChoiceMap: {},
  noMatchRedcapFields: [],
  originalToCorrectedValueMap: {},
  fieldToValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, resolveRow, navigateTo }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorSelector);
