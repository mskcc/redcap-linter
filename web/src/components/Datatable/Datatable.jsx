import React, { Component } from 'react';
import './Datatable.scss';
import '../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { Table, Input, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import Cell from '../Cell/Cell';

class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: '',
      search: '',
      filterErrors: {},
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      filterColumn,
      tableFilter,
      headers,
      tableData,
      tableErrors,
    } = nextProps;
    let filterErrors = tableErrors;
    if (tableFilter && filterColumn) {
      const indicesToFilter = [];
      for (let i = 0; i < tableData.length; i++) {
        for (let j = 0; j < headers.length; j++) {
          if (tableData[i][headers[j]] && tableData[i][headers[j]].toString() === tableFilter.toString()) {
            indicesToFilter.push(i);
            break;
          }
        }
      }
      filterErrors = indicesToFilter.map(index => tableErrors[index]);
      return { filterErrors };
    }
    return { filterErrors };
  }

  onSearchChange(e) {
    let filterErrors = [];
    const {
      headers,
      tableData,
      tableErrors,
    } = this.props;
    if (e.target.value) {
      const indicesToFilter = [];
      for (let i = 0; i < tableData.length; i++) {
        for (let j = 0; j < headers.length; j++) {
          if (tableData[i][headers[j]] && tableData[i][headers[j]].toString().includes(e.target.value)) {
            indicesToFilter.push(i);
            break;
          }
        }
      }
      filterErrors = indicesToFilter.map(index => tableErrors[index]);
    }
    this.setState({ search: e.target.value, filterErrors });
  }

  renderCell(header, cellInfo, index) {
    const {
      tableErrors,
      editable,
      matchedFieldMap,
      sheetName,
    } = this.props;

    const {
      filterErrors,
    } = this.state;
    let className = '';
    if (matchedFieldMap[sheetName] && matchedFieldMap[sheetName][header]) {
      className += ' Datatable-highlight';
    }
    // console.log(this.state);
    let tErrors = tableErrors;
    if (filterErrors.length > 0) {
      tErrors = filterErrors;
    }
    let hasError = false;
    if (tErrors[index] && tErrors[index][header]) {
      hasError = tErrors[index][header];
    }
    return (
      <Cell
        className={className}
        cellData={cellInfo[header]}
        hasError={hasError}
        editable={false}
      />
    );
  }

  // renderErrors(cellInfo) {
  //   const {
  //     tableErrors,
  //   } = this.props;
  //   let hasError = false;
  //   if (tableErrors[cellInfo.index] && tableErrors[cellInfo.index][cellInfo.column.id]) {
  //     hasError = tableErrors[cellInfo.index][cellInfo.column.id];
  //   }
  //   if (hasError) {
  //     return {
  //       style: {
  //         backgroundColor: '#E5153E',
  //       },
  //     };
  //   }
  //   return { };
  // }

  render() {
    const {
      headers,
      tableData,
      tableErrors,
      filterColumn,
      tableFilter,
      selectedRowNum,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      fieldsSaved,
      tableFieldsNotInRedcap,
      sheetInError,
      sheetName,
    } = this.props;
    const { search } = this.state;

    let columns = [];
    if (headers.length > 0) {
      columns = headers.map((header, idx) => {
        let headerClassName = 'truncated';
        let className = '';
        if (tableFieldsNotInRedcap.includes(header)) {
          headerClassName += ' Datatable-headerError';
        }
        if (sheetInError) {
          headerClassName = 'Datatable-headerError';
          className += ' Datatable-cellError';
        }
        if (!fieldsSaved && dataFieldToRedcapFieldMap[sheetName] && dataFieldToRedcapFieldMap[sheetName][header]) {
          className += ' Datatable-highlight';
        }

        if (matchedFieldMap[sheetName] && matchedFieldMap[sheetName][header]) {
          className += ' Datatable-highlight';
        }
        const column = {
          title: <Tooltip title={header}><div className={headerClassName}>{header}</div></Tooltip>,
          className,
          key: header,
          render: (text, record, index) => (this.renderCell(header, record, index)),
          // getProps: this.renderErrors.bind(this),
        };
        // if (idx > 0) {
        //   column.width = 100;
        // }
        // if (idx === 0) {
        //   column.width = 100;
        //   column.fixed = 'left';
        // }
        return column;
      });
    }

    let data = tableData;

    if (tableFilter && filterColumn) {
      const indicesToFilter = [];
      for (let i = 0; i < data.length; i++) {
        if (data[i][filterColumn] && data[i][filterColumn].toString() === tableFilter.toString()) {
          indicesToFilter.push(i);
        }
      }
      data = indicesToFilter.map(index => data[index]);
    }

    if (search) {
      const indicesToFilter = [];
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < headers.length; j++) {
          if (data[i][headers[j]] && data[i][headers[j]].toString().includes(search)) {
            indicesToFilter.push(i);
            break;
          }
        }
      }
      data = indicesToFilter.map(index => data[index]);
    }

    if (selectedRowNum || selectedRowNum === 0) {
      data = [data[selectedRowNum]];
    }

    return (
      <div>
        <div className="Datatable-searchBar">
          Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={this.onSearchChange.bind(this)} />
        </div>
        <div className="Datatable-table">
          <Table className="fixed" size="small" columns={columns} dataSource={data} scroll={{ x: columns.length * 100 }} />
        </div>
      </div>
    );
  }
}

Datatable.propTypes = {
  headers: PropTypes.array.isRequired,
  tableData: PropTypes.array,
  tableErrors: PropTypes.array,
  tableFieldsNotInRedcap: PropTypes.array,
  dataFieldToRedcapFieldMap: PropTypes.object,
  matchedFieldMap: PropTypes.object,
  sheetName: PropTypes.string,
  sheetInError: PropTypes.bool,
  editable: PropTypes.bool,
  fieldsSaved: PropTypes.bool,
};

Datatable.defaultProps = {
  tableData: [],
  tableErrors: [],
  tableFieldsNotInRedcap: [],
  dataFieldToRedcapFieldMap: {},
  matchedFieldMap: {},
  sheetName: '',
  editable: true,
  sheetInError: false,
};

export default Datatable;
