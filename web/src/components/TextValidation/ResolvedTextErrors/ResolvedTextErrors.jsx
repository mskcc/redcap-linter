import React, { Component } from 'react';
import './ResolvedTextErrors.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';

class ResolvedTextErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  renderCell(cellInfo) {
    let className = '';
    if (!cellInfo.original['Corrected Value']) {
      className = 'ResolvedTextErrors-cellError';
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
      Header: 'Original Value',
      accessor: 'Original Value',
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Corrected Value',
      accessor: 'Corrected Value',
      Cell: this.renderCell.bind(this),
    }];
    let data = tableData;
    if (search) {
      data = data.filter(row => row['Original Value'].includes(search) || row['Corrected Value'].includes(search));
    }
    return (
      <div className="ResolvedTextErrors-table">
        <div className="ResolvedTextErrors-tableTitle">
            <span className="ResolvedTextErrors-searchBar">
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

ResolvedTextErrors.propTypes = {
  tableData: PropTypes.array,
};

ResolvedTextErrors.defaultProps = {
  tableData: [],
};

export default ResolvedTextErrors;
