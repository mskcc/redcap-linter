import React, { Component } from 'react';
import './ErrorSelector.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { resolveColumn, resolveRow } from '../../actions/RedcapLinterActions';

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
      recordsMissingRequiredData,
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
      recordsMissingRequiredData,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    if (e.value.rowNum) {
      resolveRow(payload);
    } else {
      resolveColumn(payload);
    }
  }

  render() {
    const {
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      recordsMissingRequiredData,
      workingSheetName,
      workingColumn,
      workingRow,
      columnsInError,
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

    Object.keys(recordsMissingRequiredData).forEach((sheet) => {
      const subOptions = [];
      recordsMissingRequiredData[sheet].forEach((rowNumber) => {
        subOptions.push({
          value: { sheet: sheet, rowNum: rowNumber },
          label: rowNumber+2,
        });
      });
      options.push({
        label: `${sheet} | Row Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(recordsMissingRequiredData[sheet]);
    });

    let selectedValue = {}
    if (workingColumn) {
      selectedValue = {
        value: { sheet: workingSheetName, column: workingColumn },
        label: workingColumn,
      };
    } else if (workingRow) {
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

    return (
      <Select
        className="ErrorSelector-elevate"
        options={options}
        isSearchable
        value={selectedValue}
        styles={selectStyles}
        onChange={this.changeResolve.bind(this)}
      />
    );
  }
}

ErrorSelector.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
  originalToCorrectedValueMap: PropTypes.object,
};

ErrorSelector.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, resolveRow }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorSelector);
