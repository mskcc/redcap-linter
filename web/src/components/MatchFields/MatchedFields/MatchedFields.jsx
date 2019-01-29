import React, { Component } from 'react';
import './MatchedFields.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import CancelIcon from '../../CancelIcon/CancelIcon';

class MatchedFields extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  removeFieldMatch(cellInfo) {
    const {
      removeFieldMatch,
    } = this.props;
    removeFieldMatch(cellInfo.original['REDCap Field'], cellInfo.original['Data Field']);
  }

  renderCell(cellInfo) {
    let className = 'MatchedFields-cell';
    if (!cellInfo.original['Data Field']) {
      className += ' MatchedFields-cellError';
    }
    let cancelButton = '';
    if (cellInfo.column.Header === 'Data Field' && cellInfo.original['Data Field'] !== cellInfo.original['REDCap Field']) {
      cancelButton = (
        <div className="MatchedFields-cancel">
          <a onClick={e => this.removeFieldMatch(cellInfo, e)}>
            <CancelIcon />
          </a>
        </div>
      );
    }
    return (
      <div className="MatchedFields-cellContainer">
        <div className={className}>
          { cellInfo.value }
        </div>
        { cancelButton }
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
      style: { whiteSpace: 'unset' },
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Data Field',
      accessor: 'Data Field',
      style: { whiteSpace: 'unset' },
      Cell: this.renderCell.bind(this),
    }];
    let data = tableData;
    if (search) {
      data = data.filter(row => row['REDCap Field'].includes(search) || row['Data Field'].includes(search));
    }
    return (
      <div className="MatchedFields-table">
        Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
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
