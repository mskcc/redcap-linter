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
      originalToCorrectedValueMap: {},
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

  handleCorrect(originalValue) {
    const {
      originalToCorrectedValueMap,
    } = this.state;
    const {
      correctValue,
      filterTable,
    } = this.props;
    const correctedValue = originalToCorrectedValueMap[originalValue] || '';
    correctValue(originalValue, correctedValue);
  }

  handleRemove(originalValue) {
    const {
      removedValue,
    } = this.state;
    const {
      correctValue,
      filterTable,
    } = this.props;
    correctValue(originalValue, removedValue);
  }

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

  handleChange(originalValue, e) {
    const {
      originalToCorrectedValueMap,
    } = this.state;
    originalToCorrectedValueMap[originalValue] = e.target.value;
    this.setState({ originalToCorrectedValueMap });
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
      originalToCorrectedValueMap,
    } = this.state;
    const originalValue = record['Original Value'];
    const value = originalToCorrectedValueMap[originalValue] || '';
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
      originalToCorrectedValueMap,
    } = this.state;
    let disabled = true;
    if (originalToCorrectedValueMap[originalValue]) {
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
      columnsInError,
      recordsMissingRequiredData,
      fieldErrors,
    } = this.props;
    const {
      search,
      columns,
    } = this.state;

    const tableData = fieldErrors.textErrors.map(e => ({
      'Original Value': e,
      'Corrected Value': e,
      'Action': '',
    }));

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
  fieldsToMatch: PropTypes.array,
  fieldErrors: PropTypes.object,
};

TextErrorResolver.defaultProps = {
  fieldsToMatch: [],
  fieldErrors: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ correctValue, resolveColumn, resolveRow, filterTable }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TextErrorResolver);
