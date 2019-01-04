import React, { Component } from 'react';
import './Datatable.css';
import ReactTable from "react-table";
import 'react-table/react-table.css';
import { _resolve } from '../../utils/utils'

class Datatable extends Component {

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  getStateFromProps(props) {
    return {
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
      // }]
      data: []
    };
  }

  getTrProps(state, rowInfo) {
    if (rowInfo && rowInfo.row) {
      return {
        onClick: (e) => {
          this.setState({
            selected: rowInfo.index
          })
        },
        style: {
          background: rowInfo.index === this.state.selected ? '#00afec' : 'white',
          color: rowInfo.index === this.state.selected ? 'white' : 'black'
        }
      }
    } else{
      return {}
    }
  }

  renderEditable(cellInfo) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={e => {
          const data = [...this.state.data];
          data[cellInfo.index][cellInfo.column.id] = e.target.innerHTML;
          this.setState({ data });
        }}
        dangerouslySetInnerHTML={{
          __html: _resolve(cellInfo.column.id, this.state.data[cellInfo.index])
        }}
      />
    );
  }

  render() {
      const { data } = this.state;

      // const columns = [{
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
      const columns = [{
        Header: ''
      }]

    return (
    	<div className="App-datatable">
        <ReactTable
          data={data}
          className='-striped -highlight'
          columns={columns}
          defaultPageSize={18}
          minRows={18}
        />
      </div>
    	);
	}
}

export default Datatable;