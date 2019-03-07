import React, { Component } from 'react';
import './TextErrorResolver.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import {
  correctValue,
  resolveColumn,
  resolveRow,
  filterTable,
} from '../../../actions/RedcapLinterActions';

class TextErrorResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valueMap: {},
      removedValue: '',
      search: '',
      columns: [{
        title: 'Original Value',
        key: 'Original Value',
        render: (text, record) => (this.renderCell('Original Value', record)),
      },
      {
        title: 'Corrected Value',
        key: 'Corrected Value',
        width: '200px',
        render: (text, record) => (this.renderInput(record)),
      },
      {
        title: 'Action',
        key: 'Action',
        render: (text, record) => (this.renderMatchButton(record)),
      }],
    };
  }

  // TODO Add button to batch this

  onBlur(e) {
    const {
      filterTable,
    } = this.props;
    filterTable('');
  }

  onFocus(originalValue, e) {
    const {
      filterTable,
    } = this.props;
    filterTable(originalValue);
  }

  handleCorrect(originalValue) {
    const {
      valueMap,
    } = this.state;
    const {
      correctValue,
    } = this.props;
    const correctedValue = valueMap[originalValue] || '';
    correctValue(originalValue, correctedValue);
  }

  handleRemove(originalValue) {
    const {
      removedValue,
    } = this.state;
    const {
      correctValue,
    } = this.props;
    correctValue(originalValue, removedValue);
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
      filterTable,
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
    filterTable('');
    if (e.value.rowNum) {
      resolveRow(payload);
    } else {
      resolveColumn(payload);
    }
  }

  handleChange(originalValue, e) {
    const {
      valueMap,
    } = this.state;
    valueMap[originalValue] = e.target.value;
    this.setState({ valueMap });
  }

  renderCell(header, record) {
    return (
      <Cell
        cellData={record[header]}
        editable={false}
      />
    );
  }

  renderInput(record) {
    const {
      valueMap,
    } = this.state;
    const originalValue = record['Original Value'];
    const value = valueMap[originalValue] || '';
    return (
      <Input
        className="TextErrorResolver-input"
        key={`${record['Original Value']}`}
        type="text"
        value={value}
        onBlur={this.onBlur.bind(this)}
        onFocus={this.onFocus.bind(this, originalValue)}
        onChange={this.handleChange.bind(this, originalValue)}
      />
    );
  }

  renderMatchButton(record) {
    const originalValue = record['Original Value'];
    const {
      valueMap,
    } = this.state;
    let disabled = true;
    if (valueMap[originalValue]) {
      disabled = false;
    }
    return (
      <div className="TextErrorResolver-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleCorrect(originalValue, e)} className="App-submitButton">Correct</button>
        <button type="button" onClick={e => this.handleRemove(originalValue, e)} className="TextErrorResolver-noMatchButton">Remove</button>
      </div>
    );
  }

  render() {
    const {
      workingSheetName,
      workingColumn,
      originalToCorrectedValueMap,
      columnsInError,
      recordsMissingRequiredData,
      fieldErrors,
    } = this.props;
    const {
      search,
      columns,
    } = this.state;

    let valueMap = {};
    if (originalToCorrectedValueMap[workingSheetName] && originalToCorrectedValueMap[workingSheetName][workingColumn]) {
      valueMap = originalToCorrectedValueMap[workingSheetName][workingColumn];
    }

    const tableData = fieldErrors.textErrors.reduce((filtered, value) => {
      if (!Object.keys(valueMap).includes(value.toString())) {
        filtered.push({
          'Original Value': value,
        });
      }
      return filtered;
    }, []);

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

    const fieldInErrorSelector = (
      <Select
        className="TextErrorResolver-elevate"
        options={options}
        isSearchable
        value={selectedValue}
        styles={selectStyles}
        onChange={this.changeResolve.bind(this)}
      />
    );

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Original Value'].toString().includes(search));
    }

    return (
      <div className="TextErrorResolver-table">
        <div className="TextErrorResolver-tableTitle">
          <div className="TextErrorResolver-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </div>
          <div className="TextErrorResolver-textValidation">
            <b>Validation</b>: { fieldErrors.textValidation }
            <br />
            <span className="TextErrorResolver-textValidationRange"><b>Min</b>: { fieldErrors.textValidationMin || 'None' }</span>
            |
            <span className="TextErrorResolver-textValidationRange"><b>Max</b>: { fieldErrors.textValidationMax || 'None' }</span>
            |
            <span className="TextErrorResolver-textValidationRange"><b>Required</b>: { fieldErrors.required ? 'True' : 'False' }</span>
          </div>
          <div className="TextErrorResolver-tableLabel">{ fieldInErrorSelector }</div>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

TextErrorResolver.propTypes = {
  fieldErrors: PropTypes.object,
  originalToCorrectedValueMap: PropTypes.object,
};

TextErrorResolver.defaultProps = {
  fieldErrors: {},
  originalToCorrectedValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ correctValue, resolveColumn, resolveRow, filterTable }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TextErrorResolver);
