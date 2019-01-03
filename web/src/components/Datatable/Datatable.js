import React, { Component } from 'react';
import './Datatable.css';
import ReactTable from "react-table";
import 'react-table/react-table.css';

class Datatable extends Component {
  render() {
      const data = [{
        name: 'Tanner Linsley',
        age: 26,
        friend: {
          name: 'Jason Maurer',
          age: 23,
        }
      }]

      const columns = [{
        Header: 'Name',
        accessor: 'name'
      }, {
        Header: 'Age',
        accessor: 'age',
        Cell: props => <span className='number'>{props.value}</span>
      }, {
        id: 'friendName',
        Header: 'Friend Name',
        accessor: d => d.friend.name
      }, {
        Header: props => <span>Friend Age</span>,
        accessor: 'friend.age'
      }]

    return (
    	<div className="App-datatable">
        <ReactTable
          data={data}
          columns={columns}
        />
      </div>
    	);
	}
}

export default Datatable;