import React, { Component } from 'react';
import './MatchedChoices.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';

class MatchedChoices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  renderCell(cellInfo) {
    let className = '';
    if (!cellInfo.original['Permissible Value']) {
      className = 'MatchedChoices-cellError';
    }
    return (
      <div className={className}>
        { cellInfo.value }
      </div>
    );
  }

  render() {
    const {
      tableData,
    } = this.props;
    const {
      search,
    } = this.state;
    const columns = [{
      Header: 'Data Field',
      accessor: 'Data Field',
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Permissible Value',
      accessor: 'Permissible Value',
      Cell: this.renderCell.bind(this),
    }];
    let data = tableData;
    if (search) {
      data = data.filter(row => row['Data Field'].includes(search) || row['Permissible Value'].includes(search));
    }
    return (
      <div className="MatchedChoices-table">
        <div className="MatchedChoices-tableTitle">
            <span className="MatchedChoices-searchBar">
          Search: <input value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
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

MatchedChoices.propTypes = {
  tableData: PropTypes.array,
};

MatchedChoices.defaultProps = {
  tableData: [],
};

export default MatchedChoices;
