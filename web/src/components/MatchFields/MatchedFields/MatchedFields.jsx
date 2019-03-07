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
      columns: [{
        title: 'REDCap Field',
        key: 'REDCap Field',
        render: (text, record) => (this.renderCell('REDCap Field', record)),
      },
      {
        title: 'Data Field',
        key: 'Data Field',
        render: (text, record) => (this.renderCell('Data Field', record)),
      }],
    };
  }

  removeFieldMatch(cellInfo) {
    const {
      removeFieldMatch,
    } = this.props;
    removeFieldMatch(cellInfo['REDCap Field'], cellInfo['Data Field']);
  }

  renderCell(header, cellInfo) {
    let className = 'MatchedFields-cell';
    if (!cellInfo['REDCap Field'] || !cellInfo['Data Field']) {
      className += ' MatchedFields-cellError';
    }
    let cancelButton = '';
    if (header === 'Data Field' && cellInfo['Data Field'] !== cellInfo['REDCap Field']) {
      cancelButton = (
        <div className="MatchedFields-cancel">
          <a onClick={e => this.removeFieldMatch(cellInfo, e)}>
            <Icon type="close" />
          </a>
        </div>
      );
    }
    return (
      <div className="MatchedFields-cellContainer">
        <div className={className}>
          { cellInfo[header] }
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
      data = data.filter(row => row['REDCap Field'].includes(search) || row['Data Field'].includes(search));
    }
    // <ReactTable
    //   data={data}
    //   className="-striped -highlight"
    //   columns={columns}
    //   defaultPageSize={18}
    //   minRows={18}
    // />
    return (
      <div className="MatchedFields-table">
        Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

MatchedFields.propTypes = {
  tableData: PropTypes.array,
};

MatchedFields.defaultProps = {
  tableData: [],
};

export default MatchedFields;
