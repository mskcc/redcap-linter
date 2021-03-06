import React, { Component } from 'react';
import './ResolvedRowErrors.scss';
import '../../../App.scss';
import _ from 'lodash';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';

class ResolvedRowErrors extends Component {
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
          width: '100px',
          render: (text, record) => this.renderCell('Value', record),
        },
      ],
    };
  }

  removeRequiredMatch(record) {
    const { removeRowMatch } = this.props;
    const payload = {};
    payload[record.Field] = '';
    removeRowMatch(payload);
  }

  renderCell(header, record) {
    const { fieldToValueMap, workingSheetName, workingRow } = this.props;
    let cancelButton = '';
    let className = 'ResolvedRowErrors-cell';
    if (fieldToValueMap[workingSheetName] && fieldToValueMap[workingSheetName][workingRow]) {
      if (fieldToValueMap[workingSheetName][workingRow].hasOwnProperty(record.Field)) {
        className += ' ResolvedRowErrors-resolvedCell';
        if (header === 'Value') {
          cancelButton = (
            <div className="ResolvedRowErrors-cancel">
              <a onClick={e => this.removeRequiredMatch(record, e)}>
                <Icon type="close" />
              </a>
            </div>
          );
        }
      }
    }

    let cellValue = '';
    if (Array.isArray(record[header])) {
      cellValue = record[header].join(', ');
    } else {
      cellValue = record[header];
    }

    return (
      <div className="ResolvedRowErrors-cellContainer">
        <div className={className}>{cellValue}</div>
        {cancelButton}
      </div>
    );
  }

  render() {
    const { tableData, workingSheetName } = this.props;
    const { search, columns } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(
        row => row.Field.includes(search) || row.Value.toString().includes(search),
      );
    }
    return (
      <div className="ResolvedRowErrors-table">
        <div className="ResolvedRowErrors-tableTitle">
          <span className="ResolvedRowErrors-searchBar">
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

ResolvedRowErrors.propTypes = {
  tableData: PropTypes.arrayOf(PropTypes.object),
  fieldToValueMap: PropTypes.objectOf(PropTypes.any),
  workingSheetName: PropTypes.string,
  workingRow: PropTypes.number,
};

ResolvedRowErrors.defaultProps = {
  tableData: [],
  fieldToValueMap: {},
  workingSheetName: '',
  workingRow: -1,
};

export default ResolvedRowErrors;
