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
    if (!filterErrors) {
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
      filterRowNum,
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
    let filterErrors = tableErrors;

    if (tableFilter && filterColumn) {
      data = data.filter((row) => {
        if (row[filterColumn] && row[filterColumn].toString() === tableFilter.toString()) {
          return true;
        }
        return false;
      });
      filterErrors = filterErrors.filter((row) => {
        if (row[filterColumn] && row[filterColumn].toString() === tableFilter.toString()) {
          return true;
        }
        return false;
      });
    }

    if (search) {
      data = data.filter((row) => {
        for (let i = 0; i < headers.length; i++) {
          if (row[headers[i]] && row[headers[i]].toString().includes(search)) {
            return true;
          }
        }
        return false;
      });
      filterErrors = filterErrors.filter((row) => {
        for (let i = 0; i < headers.length; i++) {
          if (row[headers[i]] && row[headers[i]].toString().includes(search)) {
            return true;
          }
        }
        return false;
      });
    }

    if (selectedRowNum || selectedRowNum === 0) {
      data = [data[selectedRowNum]];
    }

    return (
      <div className="Datatable-table">
        <div className="Datatable-searchBar">
          Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value, filterErrors})} />
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
