import React, { Component } from 'react';
import './ResolvedRowErrors.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';

class ResolvedRowErrors extends Component {
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
        width: '100px',
        render: (text, record) => (this.renderCell('Value', record)),
      }],
    };
  }

  removeRequiredMatch(record) {
    const {
      updateValue,
    } = this.props;
    const payload = {};
    payload[record['Field']] = '';
    updateValue(payload);
  }

  renderCell(header, record) {
    const {
      fieldToValueMap,
    } = this.props;
    let cancelButton = '';
    let className = 'ResolvedRowErrors-cell';
    if (fieldToValueMap.hasOwnProperty(record['Field'])) {
      className += ' ResolvedRowErrors-resolvedCell'
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

    return (
      <div className="ResolvedRowErrors-cellContainer">
        <div className={className}>
          { record[header] }
        </div>
        { cancelButton }
      </div>
    );
  }

  render() {
    const {
      tableData,
      workingSheetName,
    } = this.props;
    const {
      search,
      columns,
    } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Field'].includes(search) || row['Value'].toString().includes(search));
    }
    return (
      <div className="ResolvedRowErrors-table">
        <div className="ResolvedRowErrors-tableTitle">
          <span className="ResolvedRowErrors-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
          <div className="ResolvedRowErrors-sheetInfo">
            <b>Sheet</b>: { workingSheetName }
          </div>
        </div>
        <Table size="small" columns={columns} dataSource={data} pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }} />
      </div>
    );
  }
}

ResolvedRowErrors.propTypes = {
  tableData: PropTypes.array,
  fieldToValueMap: PropTypes.object,
};

ResolvedRowErrors.defaultProps = {
  tableData: [],
  fieldToValueMap: {},
};

export default ResolvedRowErrors;
