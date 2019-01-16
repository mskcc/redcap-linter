import React, { Component } from 'react';
import './MatchedFields.css';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';

class MatchedFields extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  renderCell(cellInfo) {
    const {
      tableData,
    } = this.props;
    let className = '';
    if (!cellInfo.original['Data Field']) {
      className = 'MatchedFields-cellError';
    }
    return (
      <div className={className}>
        {tableData[cellInfo.index][cellInfo.column.id]}
      </div>
    );
  }

  render() {
    const {
      tableData,
    } = this.props;
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

    return (
      <div className="MatchedFields-table">
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

MatchedFields.propTypes = {
  tableData: PropTypes.array,
};

MatchedFields.defaultProps = {
  tableData: [],
};

export default MatchedFields;
