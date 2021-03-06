import React, { Component } from 'react';
import './MatchedFields.scss';
import '../../../App.scss';
import PropTypes from 'prop-types';
import { Table, Input, Icon } from 'antd';

class MatchedFields extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'REDCap Field',
          key: 'REDCap Field',
          render: (text, record) => this.renderCell('REDCap Field', record),
        },
        {
          title: 'Data Field',
          key: 'Data Field',
          render: (text, record) => this.renderCell('Data Field', record),
        },
        {
          title: 'Sheet',
          key: 'Sheet',
          render: (text, record) => this.renderCell('Sheet', record),
        },
      ],
    };
  }

  removeFieldMatch(cellInfo) {
    const { removeFieldMatch } = this.props;
    const payload = {
      redcapField: cellInfo['REDCap Field'],
      dataField: cellInfo['Data Field'],
      sheet: cellInfo.Sheet,
    };
    removeFieldMatch(payload);
  }

  renderCell(header, cellInfo) {
    let className = 'MatchedFields-cell';
    if (!cellInfo['REDCap Field'] || !cellInfo['Data Field']) {
      className += ' MatchedFields-cellError';
    }
    let cancelButton = '';
    if (header === 'Sheet') {
      cancelButton = (
        <div className="MatchedFields-cancel">
          <button
            type="button"
            className="App-linkButton"
            onClick={e => this.removeFieldMatch(cellInfo, e)}
          >
            <Icon type="close" />
          </button>
        </div>
      );
    }
    return (
      <div className="MatchedFields-cellContainer">
        <div className={className}>{cellInfo[header]}</div>
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
        row => row['REDCap Field'].includes(search) || row['Data Field'].includes(search),
      );
    }
    return (
      <div className="MatchedFields-table">
        {'Search: '}
        <Input
          className="App-tableSearchBar"
          value={search}
          onChange={e => this.setState({ search: e.target.value })}
        />
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

MatchedFields.propTypes = {
  tableData: PropTypes.arrayOf(PropTypes.object),
};

MatchedFields.defaultProps = {
  tableData: [],
};

export default MatchedFields;
