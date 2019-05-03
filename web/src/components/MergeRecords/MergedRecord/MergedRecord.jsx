import React, { Component } from 'react';
import './MergedRecord.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';

class MergedRecord extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      // columns: [{
      //   Header: 'Field',
      //   accessor: 'Field',
      //   style: { whiteSpace: 'unset' },
      //   Cell: this.renderCell.bind(this),
      // },
      // {
      //   Header: 'Value',
      //   accessor: 'Value',
      //   style: { whiteSpace: 'unset' },
      //   Cell: this.renderCell.bind(this),
      // }],
      columns: [{
        title: 'Field',
        key: 'Field',
        render: (text, record) => (this.renderCell('Field', record)),
      },
      {
        title: 'Value',
        key: 'Value',
        render: (text, record) => (this.renderCell('Value', record)),
      }],
    };
  }

  removeChoiceMatch(cellInfo) {
    const {
      removeChoiceMatch,
    } = this.props;
    removeChoiceMatch(cellInfo['Field'], cellInfo['Value']);
  }

  renderCell(header, cellInfo) {
    let className = 'MergedRecord-cell';
    if (!cellInfo['Value']) {
      className += ' MergedRecord-cellError';
    }
    let cellValue = '';
    if (Array.isArray(cellInfo[header])) {
      cellValue = cellInfo[header].join(', ');
    } else {
      cellValue = cellInfo[header];
    }
    let cancelButton = '';
    if (header === 'Value' && cellInfo['Value'] !== cellInfo['Field']) {
      cancelButton = (
        <div className="MergedRecord-cancel">
          <a onClick={e => this.removeChoiceMatch(cellInfo, e)}>
            <Icon type="close" />
          </a>
        </div>
      );
    }
    return (
      <div className="MergedRecord-cellContainer">
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
      data = data.filter(row => row['Field'].includes(search) || String(row['Value']).includes(search));
    }
    return (
      <div className="MergedRecord-table">
        <div className="MergedRecord-tableTitle">
            <span className="MergedRecord-searchBar">
          Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
        </div>
        <Table size="small" columns={columns} dataSource={data} pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }} />
      </div>
    );
  }
}

MergedRecord.propTypes = {
  tableData: PropTypes.array,
};

MergedRecord.defaultProps = {
  tableData: [],
};

export default MergedRecord;
