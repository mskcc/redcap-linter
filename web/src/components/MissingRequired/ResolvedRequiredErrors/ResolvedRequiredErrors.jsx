import React, { Component } from 'react';
import './ResolvedRequiredErrors.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';

class ResolvedRequiredErrors extends Component {
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
    let className = 'ResolvedRequiredErrors-cell';
    if (fieldToValueMap.hasOwnProperty(record['Field'])) {
      className += ' ResolvedRequiredErrors-resolvedCell'
      if (header === 'Value') {
        cancelButton = (
          <div className="ResolvedRequiredErrors-cancel">
            <a onClick={e => this.removeRequiredMatch(record, e)}>
              <Icon type="close" />
            </a>
          </div>
        );
      }
    }

    return (
      <div className="ResolvedRequiredErrors-cellContainer">
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
      <div className="ResolvedRequiredErrors-table">
        <div className="ResolvedRequiredErrors-tableTitle">
          <span className="ResolvedRequiredErrors-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
          <div className="ResolvedRequiredErrors-sheetInfo">
            <b>Sheet</b>: { workingSheetName }
          </div>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

ResolvedRequiredErrors.propTypes = {
  tableData: PropTypes.array,
  fieldToValueMap: PropTypes.object,
};

ResolvedRequiredErrors.defaultProps = {
  tableData: [],
  fieldToValueMap: {},
};

export default ResolvedRequiredErrors;
