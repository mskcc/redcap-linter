import React, { Component } from 'react';
import './MergedRecord.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { removeMerge } from '../../../actions/REDCapLinterActions';

class MergedRecord extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Field',
          key: 'Field',
          render: (text, record) => this.renderCell('Field', record),
        },
        {
          title: 'Value',
          key: 'Value',
          render: (text, record) => this.renderCell('Value', record),
        },
      ],
    };
  }

  removeMerge(cellInfo) {
    const { removeMerge } = this.props;
    const payload = {
      field: cellInfo.Field,
    };
    removeMerge(payload);
  }

  renderCell(header, cellInfo) {
    let className = 'MergedRecord-cell';
    if (!cellInfo.Value) {
      className += ' MergedRecord-cellError';
    }
    let cellValue = '';
    if (Array.isArray(cellInfo[header])) {
      cellValue = cellInfo[header].join(', ');
    } else {
      cellValue = cellInfo[header];
    }
    if (
      header === 'Value'
      && cellInfo['Merged Value']
      && cellInfo['Merged Value'] !== cellInfo.Value
    ) {
      cellValue = (
        <p>
          <del>{cellValue}</del>
          {` ${cellInfo['Merged Value']}`}
        </p>
      );
    }
    let cancelButton = '';
    if (
      header === 'Value'
      && cellInfo['Merged Value']
      && cellInfo['Merged Value'] !== cellInfo.Value
    ) {
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
        <div className={className}>{cellValue}</div>
        {cancelButton}
      </div>
    );
  }

  render() {
    const {
      jsonData,
      workingSheetName,
      workingMergeRow,
      mergeMap,
      recordidField,
      reconciliationColumns,
      matchingRepeatInstances,
      dataFieldToRedcapFieldMap,
    } = this.props;

    if (workingMergeRow < 0) {
      return null;
    }

    let rowMergeMap = {};
    if (mergeMap[workingSheetName] && mergeMap[workingSheetName][workingMergeRow]) {
      rowMergeMap = mergeMap[workingSheetName][workingMergeRow];
    }

    const row = jsonData[workingSheetName][workingMergeRow];

    let matchingRepeatInstruments = [];
    if (
      matchingRepeatInstances[workingSheetName]
      && matchingRepeatInstances[workingSheetName][workingMergeRow]
    ) {
      matchingRepeatInstruments = Object.keys(
        matchingRepeatInstances[workingSheetName][workingMergeRow],
      );
    }

    let reconciliationFields = [];
    Object.keys(reconciliationColumns).forEach((repeatInstrument) => {
      if (matchingRepeatInstruments.includes(repeatInstrument)) {
        reconciliationFields = reconciliationFields.concat(reconciliationColumns[repeatInstrument]);
      }
    });
    reconciliationFields.push(recordidField);

    const matchingHeaders = Object.values(dataFieldToRedcapFieldMap[workingSheetName]);
    const tableData = matchingHeaders.reduce((filtered, field) => {
      if (!reconciliationFields.includes(field)) {
        filtered.push({
          Field: field,
          Value: row[field] || '',
          'Merged Value': rowMergeMap[field] || '',
        });
      }
      return filtered;
    }, []);

    // console.log(row);

    reconciliationFields.forEach((field) => {
      tableData.unshift({
        Field: field,
        Value: row[field],
        'Merged Value': '',
      });
    });

    const { search, columns } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(r => r.Field.includes(search) || String(r.Value).includes(search));
    }
    return (
      <div className="MergedRecord-table">
        <div className="MergedRecord-tableTitle">
          <span className="MergedRecord-searchBar">
            {'Search: '}
            <Input
              className="App-tableSearchBar"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
          </span>
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          pagination={{ defaultPageSize: 5, showSizeChanger: true, showQuickJumper: true }}
        />
      </div>
    );
  }
}

MergedRecord.propTypes = {
  mergeMap: PropTypes.objectOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.array),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  reconciliationColumns: PropTypes.objectOf(PropTypes.array),
  matchingRepeatInstances: PropTypes.objectOf(PropTypes.object),
  recordidField: PropTypes.string,
  workingSheetName: PropTypes.string,
  workingMergeRow: PropTypes.number,
};

MergedRecord.defaultProps = {
  mergeMap: {},
  jsonData: {},
  dataFieldToRedcapFieldMap: {},
  reconciliationColumns: {},
  matchingRepeatInstances: {},
  recordidField: '',
  workingSheetName: '',
  workingMergeRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeMerge }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MergedRecord);
