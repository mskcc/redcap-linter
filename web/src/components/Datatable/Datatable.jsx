import React, { Component } from 'react';
import './Datatable.css';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import Cell from '../Cell/Cell';

class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: '',
      // data: [{
      //   name: 'Tanner Linsley',
      //   age: 26,
      //   friend: {
      //     name: 'Jason Maurer',
      //     age: 23,
      //   }
      // },
      // {
      //   name: 'Craig Perkins',
      //   age: 26,
      //   friend: {
      //     name: 'Jason Berlinsky',
      //     age: 26,
      //   }
      // }],
      data: [],
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
      tableData,
      tableErrors,
      editable,
    } = this.props;
    let hasError = false;
    if (tableErrors[cellInfo.index] && tableErrors[cellInfo.index][cellInfo.column.id]) {
      hasError = tableErrors[cellInfo.index][cellInfo.column.id];
    }
    return (
      <Cell
        cellData={tableData[cellInfo.index][cellInfo.column.id]}
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
      tableFieldsNotInRedcap,
      sheetInError,
    } = this.props;
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

    // columns = [{
    //   Header: 'Name',
    //   accessor: 'name',
    //   Cell: this.renderEditable.bind(this)
    // }, {
    //   Header: 'Age',
    //   accessor: 'age',
    //   Cell: this.renderEditable.bind(this)
    // }, {
    //   Header: 'Friend Name',
    //   accessor: 'friend.name',
    //   Cell: this.renderEditable.bind(this)
    // }, {
    //   Header: props => <span>Friend Age</span>,
    //   accessor: 'friend.age',
    //   Cell: this.renderEditable.bind(this)
    // }]

    return (
      <div className="Datatable-table">
        <ReactTable
          data={tableData}
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
};

export default Datatable;
