import React, { Component } from 'react';
import './RequiredResolver.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { updateValue, resolveRow, resolveColumn, filterRow } from '../../../actions/RedcapLinterActions';

class RequiredResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localFieldToValueMap: {},
      search: '',
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
    };
    if (e.value.rowNum) {
      resolveRow(payload);
    } else {
      resolveColumn(payload);
    }
  }

  onFocus(e) {
    const {
      sheet,
      rowNum,
      filterRow,
    } = this.props;
    filterRow(sheet, rowNum);
  }

  onBlur(e) {
    const {
      sheet,
      filterRow,
    } = this.props;
    filterRow(sheet, '');
  }

  handleUpdate(field, e) {
    const {
      localFieldToValueMap,
    } = this.state;
    const {
      updateValue,
    } = this.props;
    updateValue(field, localFieldToValueMap[field]);
  }

  handleSelectChange(field, e) {
    const {
      localFieldToValueMap,
    } = this.state;
    localFieldToValueMap[field] = e.value;
    this.setState({ localFieldToValueMap });
  }

  handleChange(field, e) {
    const {
      localFieldToValueMap,
    } = this.state;
    localFieldToValueMap[field] = e.target.value;
    this.setState({ localFieldToValueMap });
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
      localFieldToValueMap,
    } = this.state;
    const {
      ddData,
    } = this.props;
    const fieldName = cellInfo.original['Field'];
    const ddField = ddData.find((field) => {
      return field.field_name === fieldName;
    });
    const value = localFieldToValueMap[fieldName] || '';
    if (ddField.choices_dict) {
      const options = [];
      Object.keys(ddField.choices_dict).forEach((choice) => {
        options.push({
          value: choice,
          label: <span><b>{choice}</b> | <span style={{ fontWeight: 'lighter' }}>{ddField.choices_dict[choice]}</span></span>,
        })
      });
      return (
        <Select
          options={options}
          isSearchable
          onFocus={e => this.onFocus(e)}
          onBlur={e => this.onBlur(e)}
          onChange={e => this.handleSelectChange(fieldName, e)}
          placeholder="Select..."
        />
      );
    }
    return (
      <input
        className="RequiredResolver-input"
        type="text"
        onFocus={e => this.onFocus(e)}
        onBlur={e => this.onBlur(e)}
        value={value}
        onChange={e => this.handleChange(fieldName, e)}
      />
    );
  }

  renderMatchButton(cellInfo) {
    const field = cellInfo.original['Field'];
    const {
      localFieldToValueMap,
    } = this.state;
    let disabled = true;
    if (localFieldToValueMap[field]) {
      disabled = false;
    }
    return (
      <div className="RequiredResolver-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleUpdate(field, e)} className="App-submitButton">Update</button>
      </div>
    );
  }

  render() {
    const {
      workingSheetName,
      recordsMissingRequiredData,
      columnsInError,
      row,
      rowNum,
      fieldToValueMap,
      requiredDdFields,
    } = this.props;
    const {
      search,
    } = this.state;
    const columns = [{
      Header: 'Field',
      accessor: 'Field',
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Value',
      accessor: 'Value',
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
        label: sheet,
        options: subOptions,
      });
      allErrors = allErrors.concat(recordsMissingRequiredData[sheet]);
    });

    const selectedValue = {
      value: { sheet: workingSheetName, rowNum: rowNum },
      label: rowNum+1,
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

    const rowInErrorSelector = (
      <Select
        options={options}
        isSearchable
        value={selectedValue}
        styles={selectStyles}
        onChange={this.changeResolve.bind(this)}
      />
    );

    const tableData = Object.keys(row).reduce((filtered, field) => {
      if (requiredDdFields.indexOf(field) >= 0 && !fieldToValueMap.hasOwnProperty(field) && !row[field]) {
        filtered.push({
          'Field': field,
          'Value': field,
          'Action': '',
        })
      }
      return filtered;
    }, []);

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Field'].includes(search));
    }

    return (
      <div className="RequiredResolver-table">
        <div className="RequiredResolver-tableTitle">
          <div className="RequiredResolver-searchBar">
            Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </div>
          <div className="RequiredResolver-tableLabel">{ rowInErrorSelector }</div>
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

RequiredResolver.propTypes = {
  fieldsToMatch: PropTypes.array,
  fieldToValueMap: PropTypes.object,
};

RequiredResolver.defaultProps = {
  fieldsToMatch: [],
  fieldToValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ updateValue, resolveRow, resolveColumn, filterRow }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RequiredResolver);
