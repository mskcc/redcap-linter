import React, { Component } from 'react';
import './Datatable.scss';
import '../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
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

  getTrProps(state, rowInfo) {
    if (rowInfo && rowInfo.row) {
      const { selected } = this.state;
      return {
        onClick: (e) => {
          this.setState({
            selected: rowInfo.index,
          });
        },
        style: {
          background: rowInfo.index === selected ? '#00afec' : 'white',
          color: rowInfo.index === selected ? 'white' : 'black',
        },
      };
    }
    return { };
  }

  renderCell(cellInfo) {
    const {
      tableErrors,
      editable,
    } = this.props;
    const {
      filterErrors,
    } = this.state;
    let tErrors = tableErrors;
    if (filterErrors.length > 0) {
      tErrors = filterErrors;
    }
    let hasError = false;
    if (tErrors[cellInfo.index] && tErrors[cellInfo.index][cellInfo.column.id]) {
      hasError = tErrors[cellInfo.index][cellInfo.column.id];
    }
    return (
      <Cell
        cellData={cellInfo.value}
        hasError={hasError}
        editable={editable}
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
      tableFieldsNotInRedcap,
      sheetInError,
    } = this.props;
    const { search } = this.state;
    let columns = [{
      Header: '',
    }];
    if (headers.length > 0) {
      columns = headers.map((header) => {
        let headerClassName = '';
        let className = '';
        if (tableFieldsNotInRedcap.includes(header)) {
          headerClassName = 'Datatable-headerError';
        }
        if (sheetInError) {
          headerClassName = 'Datatable-headerError';
          className = 'Datatable-cellError';
        }
        return {
          Header: header,
          headerClassName,
          className,
          accessor: header,
          Cell: this.renderCell.bind(this),
          // getProps: this.renderErrors.bind(this),
        };
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
      <div className="Datatable-table">
        <div className="Datatable-searchBar">
          Search: <input className="App-tableSearchBar" value={this.state.search} onChange={this.onSearchChange.bind(this)} />
        </div>
        <ReactTable
          data={data}
          className="-striped -highlight"
          columns={columns}
          defaultPageSize={18}
          minRows={18}
        />
      </div>
    );
  }
}

Datatable.propTypes = {
  headers: PropTypes.array.isRequired,
  tableData: PropTypes.array,
  tableErrors: PropTypes.array,
  tableFieldsNotInRedcap: PropTypes.array,
  sheetName: PropTypes.string,
  sheetInError: PropTypes.bool,
  editable: PropTypes.bool,
};

Datatable.defaultProps = {
  tableData: [],
  tableErrors: [],
  tableFieldsNotInRedcap: [],
  sheetName: '',
  editable: true,
  sheetInError: false,
};

export default Datatable;
