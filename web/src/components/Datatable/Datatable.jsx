import React, { Component } from 'react';
import './Datatable.css';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { _resolve } from '../../utils/utils';
import { postForm } from '../../actions/RedcapLinterActions';

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
          })
        },
        style: {
          background: rowInfo.index === selected ? '#00afec' : 'white',
          color: rowInfo.index === selected ? 'white' : 'black',
        },
      };
    }
    return { };
  }

  renderEditable(cellInfo) {
    const { data } = this.state;
    let tableData = data;
    const { sheetName, jsonData } = this.props;
    if (jsonData && jsonData[sheetName]) {
      // TODO Find a better way to do this!!!
      tableData = JSON.parse(jsonData[sheetName]);
    }
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const tData = [...tableData];
          tData[cellInfo.index][cellInfo.column.id] = e.target.innerHTML;
          this.setState({ data: tData });
        }}
        dangerouslySetInnerHTML={{
          __html: tableData[cellInfo.index][cellInfo.column.id],
        }}
      />
    );
  }

  render() {
    const { data } = this.state;
    let tableData = data;
    const { csvHeaders, sheetName, jsonData } = this.props;
    if (jsonData && jsonData[sheetName]) {
      // TODO Find a better way to do this!!!
      tableData = JSON.parse(jsonData[sheetName]);
    }
    const sheetHeaders = csvHeaders[sheetName] || [];
    let columns = [{
      Header: '',
    }];
    if (sheetHeaders.length > 0) {
      columns = sheetHeaders.map((header) => {
        return {
          Header: header,
          accessor: header,
          // Cell: this.renderEditable.bind(this)
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
      <div>
        <ReactTable
          data={tableData}
          className='-striped -highlight'
          columns={columns}
          defaultPageSize={18}
          minRows={18}
        />
      </div>
    );
  }
}

Datatable.propTypes = {
  csvHeaders: PropTypes.object.isRequired,
  sheetName: PropTypes.string,
  jsonData: PropTypes.object,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Datatable);
