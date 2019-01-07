import React, { Component } from 'react';
import './Datatable.css';
import ReactTable from "react-table";
import 'react-table/react-table.css';
import { _resolve } from '../../utils/utils'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { postForm } from '../../actions/RedcapLinterActions';

class Datatable extends Component {

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  getStateFromProps(props) {
    return {
      selected: '',
      data: [{
        name: 'Tanner Linsley',
        age: 26,
        friend: {
          name: 'Jason Maurer',
          age: 23,
        }
      },
      {
        name: 'Craig Perkins',
        age: 26,
        friend: {
          name: 'Jason Berlinsky',
          age: 26,
        }
      }]
      // data: []
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
      let columns = [{
        Header: ''
      }]
      if (this.props.csv_headers) {
        columns = this.props.csv_headers.map(header => { 
          return {
            Header: header,
            accessor: header,
            Cell: this.renderEditable.bind(this)
          };
        });
      }

      columns = [{
        Header: 'Name',
        accessor: 'name',
        Cell: this.renderEditable.bind(this)
      }, {
        Header: 'Age',
        accessor: 'age',
        Cell: this.renderEditable.bind(this)
      }, {
        Header: 'Friend Name',
        accessor: 'friend.name',
        Cell: this.renderEditable.bind(this)
      }, {
        Header: props => <span>Friend Age</span>,
        accessor: 'friend.age',
        Cell: this.renderEditable.bind(this)
      }]

    return (
    	<div>
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

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm: postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Datatable);