import React, { Component } from 'react';
import './ResolvedTextErrors.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';

class ResolvedTextErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [{
        title: 'Original Value',
        key: 'Original Value',
        render: (text, record) => (this.renderCell('Original Value', record)),
      },
      {
        title: 'Corrected Value',
        key: 'Corrected Value',
        render: (text, record) => (this.renderCell('Corrected Value', record)),
      }],
    };
  }

  renderCell(header, record) {
    let className = '';
    if (!record['Corrected Value']) {
      className = 'ResolvedTextErrors-cellError';
    }
    return (
      <div className={className}>
        { record[header] }
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
      data = data.filter(row => row['Original Value'].includes(search) || row['Corrected Value'].includes(search));
    }
    return (
      <div className="ResolvedTextErrors-table">
        <div className="ResolvedTextErrors-tableTitle">
            <span className="ResolvedTextErrors-searchBar">
          Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

ResolvedTextErrors.propTypes = {
  tableData: PropTypes.array,
};

ResolvedTextErrors.defaultProps = {
  tableData: [],
};

export default ResolvedTextErrors;
