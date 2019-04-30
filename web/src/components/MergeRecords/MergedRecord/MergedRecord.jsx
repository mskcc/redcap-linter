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
    let className = 'MergedRecord-cell';
    if (!cellInfo['Permissible Value']) {
      className += ' MergedRecord-cellError';
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
      data = data.filter(row => row['Data Field'].includes(search) || row['Permissible Value'].includes(search));
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
