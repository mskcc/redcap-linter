import React, { Component } from 'react';
import './ResolvedTextErrors.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';

class ResolvedTextErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Original Value',
          key: 'Original Value',
          render: (text, record) => this.renderCell('Original Value', record),
        },
        {
          title: 'Corrected Value',
          key: 'Corrected Value',
          render: (text, record) => this.renderCell('Corrected Value', record),
        },
      ],
    };
  }

  removeValueMatch(record) {
    const { removeValueMatch } = this.props;
    const payload = {};
    payload[record['Original Value']] = record['Corrected Value'];
    removeValueMatch(payload);
  }

  renderCell(header, record) {
    let className = 'ResolvedTextErrors-cell';
    if (!record['Corrected Value']) {
      className += ' ResolvedTextErrors-cellError';
    }
    let cancelButton = '';
    if (header === 'Corrected Value' && record['Original Value'] !== record['Corrected Value']) {
      cancelButton = (
        <div className="MatchedChoices-cancel">
          <a onClick={e => this.removeValueMatch(record, e)}>
            <Icon type="close" />
          </a>
        </div>
      );
    }
    return (
      <div className="ResolvedTextErrors-cellContainer">
        <div className={className}>{record[header]}</div>
        {cancelButton}
      </div>
    );
  }

  render() {
    const { tableData } = this.props;
    const { search, columns } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(
        row => row['Original Value'].includes(search) || row['Corrected Value'].includes(search),
      );
    }
    return (
      <div className="ResolvedTextErrors-table">
        <div className="ResolvedTextErrors-tableTitle">
          <span className="ResolvedTextErrors-searchBar">
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
          pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }}
        />
      </div>
    );
  }
}

ResolvedTextErrors.propTypes = {
  tableData: PropTypes.arrayOf(PropTypes.object),
};

ResolvedTextErrors.defaultProps = {
  tableData: [],
};

export default ResolvedTextErrors;
