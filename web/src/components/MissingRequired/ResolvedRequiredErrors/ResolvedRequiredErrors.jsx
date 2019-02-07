import React, { Component } from 'react';
import './ResolvedRequiredErrors.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import CancelIcon from '../../CancelIcon/CancelIcon';

class ResolvedRequiredErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [{
        Header: 'Field',
        accessor: 'Field',
        Cell: this.renderCell.bind(this),
      },
      {
        Header: 'Value',
        accessor: 'Value',
        Cell: this.renderCell.bind(this),
      }],
    };
  }

  removeRequiredMatch(cellInfo) {
    const {
      updateValue,
    } = this.props;
    updateValue(cellInfo.original['Field'], '');
  }

  renderCell(cellInfo) {
    const {
      fieldToValueMap,
    } = this.props;
    let cancelButton = '';
    let className = 'ResolvedRequiredErrors-cell';
    if (fieldToValueMap.hasOwnProperty(cellInfo.original['Field'])) {
      className += " ResolvedRequiredErrors-resolvedCell"
      if (cellInfo.column.Header === 'Value') {
        cancelButton = (
          <div className="ResolvedRequiredErrors-cancel">
            <a onClick={e => this.removeRequiredMatch(cellInfo, e)}>
              <CancelIcon />
            </a>
          </div>
        );
      }
    }

    return (
      <div className="ResolvedRequiredErrors-cellContainer">
        <div className={className}>
          { cellInfo.value }
        </div>
        { cancelButton }
      </div>
    );
  }

  render() {
    const {
      tableData,
      sheet,
      rowNum,
    } = this.props;
    const {
      search,
      columns,
    } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Field'].includes(search) || row['Value'].includes(search));
    }
    return (
      <div className="ResolvedRequiredErrors-table">
        <div className="ResolvedRequiredErrors-tableTitle">
          <span className="ResolvedRequiredErrors-searchBar">
            Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
          <div className="ResolvedRequiredErrors-sheetInfo">
            <b>Sheet</b>: { sheet }
            <br />
            <b>Row num</b>: { rowNum }
          </div>
        </div>
        <ReactTable
          data={data}
          className="-striped -highlight"
          columns={columns}
          defaultPageSize={12}
          minRows={12}
        />
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
