import React, { Component } from 'react';
import './TextErrorResolver.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { correctValue, resolveColumn, filterTable } from '../../../actions/RedcapLinterActions';

class TextErrorResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      originalToCorrectedValueMap: {},
      removedValue: '',
      search: '',
    };
  }

  changeResolveColumn(e) {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      columnsInError,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      nextColumn: e.value.column,
      nextSheetName: e.value.sheet,
      columnsInError,
      ddData,
      csvHeaders,
    };
    resolveColumn(payload);
  }

  handleCorrect(originalValue) {
    const {
      originalToCorrectedValueMap,
    } = this.state;
    const {
      correctValue,
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

  renderCell(cellInfo) {
    return (
      <Cell
        cellData={cellInfo.value}
        editable={false}
      />
    );
  }

  renderInput(cellInfo) {
    const {
      originalToCorrectedValueMap,
    } = this.state;
    const originalValue = cellInfo.original['Original Value'];
    const value = originalToCorrectedValueMap[originalValue] || '';
    return (
      <input
        className="TextErrorResolver-input"
        type="text"
        value={value}
        onBlur={e => this.onBlur(e)}
        onFocus={e => this.onFocus(originalValue, e)}
        onChange={e => this.handleChange(originalValue, e)}
      />
    );
  }

  renderMatchButton(cellInfo) {
    const originalValue = cellInfo.original['Original Value'];
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
      fieldErrors,
    } = this.props;
    const {
      search,
    } = this.state;
    const columns = [{
      Header: 'Original Value',
      accessor: 'Original Value',
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Corrected Value',
      accessor: 'Corrected Value',
      style: { overflow: 'visible' },
      Cell: this.renderInput.bind(this),
      // getProps: this.renderErrors.bind(this),
    },
    {
      Header: 'Action',
      accessor: 'Action',
      style: { overflow: 'visible' },
      Cell: this.renderMatchButton.bind(this),
      // getProps: this.renderErrors.bind(this),
    }];
    const tableData = fieldErrors.textErrors.map(e => ({
      'Original Value': e,
      'Corrected Value': e,
      'Action': '',
    }));

    const options = [];
    let allColumnErrors = [];
    Object.keys(columnsInError).forEach((sheet) => {
      const subOptions = [];
      columnsInError[sheet].forEach((columnInError) => {
        subOptions.push({
          value: { sheet: sheet, column: columnInError },
          label: columnInError,
        });
      });
      options.push({
        label: sheet,
        options: subOptions,
      });
      allColumnErrors = allColumnErrors.concat(columnsInError[sheet]);
    });

    const selectedValue = {
      value: { sheet: workingSheetName, column: workingColumn },
      label: workingColumn,
    };

    const longestOption = allColumnErrors.sort((a, b) => b.length - a.length)[0];
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
        onChange={this.changeResolveColumn.bind(this)}
      />
    );

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Original Value'].includes(search));
    }

    return (
      <div className="TextErrorResolver-table">
        <div className="TextErrorResolver-tableTitle">
          <div className="TextErrorResolver-searchBar">
            Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
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
        <ReactTable
          data={data}
          className="-striped -highlight"
          columns={columns}
          defaultPageSize={12}
          minRows={12}
        />
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
  return bindActionCreators({ correctValue, resolveColumn, filterTable }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TextErrorResolver);
