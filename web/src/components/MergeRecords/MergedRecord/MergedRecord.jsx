import React, { Component } from 'react';
import './MergedRecord.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { removeMerge } from '../../../actions/RedcapLinterActions';

class MergedRecord extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
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

  removeMerge(cellInfo) {
    const {
      removeMerge,
    } = this.props;
    const payload = {
      field: cellInfo['Field'],
    }
    removeMerge(payload);
  }

  renderCell(header, cellInfo) {
    const {
      mergeMap,
      workingSheetName,
      workingMergeRow,
      removeChoiceMatch,
    } = this.props;
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
    if (header === 'Value' && cellInfo['Merged Value'] && cellInfo['Merged Value'] !== cellInfo['Value']) {
      cellValue = (<p><del>{ cellValue }</del> {cellInfo['Merged Value']}</p>);
    }
    let cancelButton = '';
    if (header === 'Value' && cellInfo['Merged Value'] && cellInfo['Merged Value'] !== cellInfo['Value']) {
      cancelButton = (
        <div className="MergedRecord-cancel">
          <a onClick={e => this.removeMerge(cellInfo, e)}>
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
      jsonData,
      csvHeaders,
      workingSheetName,
      workingMergeRow,
      mergeMap,
      dataFieldToRedcapFieldMap,
    } = this.props;

    if (workingMergeRow < 0) {
      return null;
    }

    let rowMergeMap = {}
    if (mergeMap[workingSheetName] && mergeMap[workingSheetName][workingMergeRow]) {
      rowMergeMap = mergeMap[workingSheetName][workingMergeRow];
    }

    const row = jsonData[workingSheetName][workingMergeRow];

    const matchingHeaders = Object.values(dataFieldToRedcapFieldMap[workingSheetName]);
    const tableData = matchingHeaders.reduce((filtered, field) => {
      filtered.push({
        'Field': field,
        'Value': row[field] || '',
        'Merged Value': rowMergeMap[field] || '',
      });
      return filtered;
    }, []);

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
  mergeMap: PropTypes.object,
  tableData: PropTypes.array,
};

MergedRecord.defaultProps = {
  mergeMap: {},
  tableData: [],
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeMerge }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MergedRecord);
