import React, { Component } from 'react';
import './MatchedChoices.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { Table, Divider, Tag } from 'antd';
import PropTypes from 'prop-types';
import CancelIcon from '../../CancelIcon/CancelIcon';

class MatchedChoices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      // columns: [{
      //   Header: 'Data Field',
      //   accessor: 'Data Field',
      //   style: { whiteSpace: 'unset' },
      //   Cell: this.renderCell.bind(this),
      // },
      // {
      //   Header: 'Permissible Value',
      //   accessor: 'Permissible Value',
      //   style: { whiteSpace: 'unset' },
      //   Cell: this.renderCell.bind(this),
      // }],
      columns: [{
        title: 'Data Field',
        key: 'Data Field',
        render: (text, record) => (this.renderCell('Data Field', record)),
      },
      {
        title: 'Permissible Value',
        key: 'Permissible Value',
        render: (text, record) => (this.renderCell('Permissible Value', record)),
      }],
    };
  }

  removeChoiceMatch(cellInfo) {
    const {
      removeChoiceMatch,
    } = this.props;
    removeChoiceMatch(cellInfo['Data Field'], cellInfo['Permissible Value']);
  }

  renderCell(header, cellInfo) {
    let className = 'MatchedChoices-cell';
    if (!cellInfo['Permissible Value']) {
      className += ' MatchedChoices-cellError';
    }
    let cellValue = '';
    if (Array.isArray(cellInfo[header])) {
      cellValue = cellInfo[header].join(', ');
    } else {
      cellValue = cellInfo[header];
    }
    let cancelButton = '';
    if (header === 'Permissible Value' && cellInfo['Permissible Value'] !== cellInfo['Data Field']) {
      cancelButton = (
        <div className="MatchedChoices-cancel">
          <a onClick={e => this.removeChoiceMatch(cellInfo, e)}>
            <CancelIcon />
          </a>
        </div>
      );
    }
    return (
      <div className="MatchedChoices-cellContainer">
        <div className={className}>
          { cellValue }
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
      columns,
    } = this.state;
    let data = tableData;
    if (search) {
      data = data.filter(row => row['Data Field'].includes(search) || row['Permissible Value'].includes(search));
    }
    return (
      <div className="MatchedChoices-table">
        <div className="MatchedChoices-tableTitle">
            <span className="MatchedChoices-searchBar">
          Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
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
