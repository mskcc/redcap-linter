import React, { Component } from 'react';
import './MatchedFields.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';

class MatchedFields extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  renderCell(cellInfo) {
    let className = '';
    if (!cellInfo.original['Data Field']) {
      className = 'MatchedFields-cellError';
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
      Header: 'REDCap Field',
      accessor: 'REDCap Field',
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Data Field',
      accessor: 'Data Field',
      Cell: this.renderCell.bind(this),
    }];
    let data = tableData;
    if (search) {
      data = data.filter(row => row['REDCap Field'].includes(search) || row['Data Field'].includes(search));
    }
    return (
      <div className="MatchedFields-table">
        Search: <input value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
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

MatchedFields.propTypes = {
  tableData: PropTypes.array,
};

MatchedFields.defaultProps = {
  tableData: [],
};

export default MatchedFields;
