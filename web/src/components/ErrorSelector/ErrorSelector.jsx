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
      recordsMissingRequiredData,
      workingSheetName,
      workingColumn,
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
          label: rowNumber+1,
        });
      });
      options.push({
        label: `${sheet} | Row Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(recordsMissingRequiredData[sheet]);
    });

    const selectedValue = {
      value: { sheet: workingSheetName, column: workingColumn },
      label: workingColumn,
    };

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
};

ErrorSelector.defaultProps = {
  fieldErrors: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, resolveRow }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorSelector);
