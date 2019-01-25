import React, { Component } from 'react';
import './MatchedChoices.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import CancelIcon from '../../CancelIcon/CancelIcon';
import { removeChoiceMatch } from '../../../actions/RedcapLinterActions';

class MatchedChoices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  removeChoiceMatch(cellInfo) {
    const {
      removeChoiceMatch,
    } = this.props;
    removeChoiceMatch(cellInfo.original['Data Field'], cellInfo.original['Permissible Value']);
  }

  renderCell(cellInfo) {
    let className = 'MatchedChoices-cell';
    if (!cellInfo.original['Permissible Value']) {
      className += ' MatchedChoices-cellError';
    }
    let cancelButton = '';
    if (cellInfo.column.Header === 'Permissible Value' && cellInfo.original['Permissible Value'] !== cellInfo.original['Data Field']) {
      cancelButton = (
        <div className="MatchedChoices-cancel">
          <a onClick={e => this.removeChoiceMatch(cellInfo, e)}>
            <CancelIcon />
          </a>
        </div>
      );
    }
    return (
      <div className="MatchedChoices-cellContainer">
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
    } = this.props;
    const {
      search,
    } = this.state;
    const columns = [{
      Header: 'Data Field',
      accessor: 'Data Field',
      style: { whiteSpace: 'unset' },
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Permissible Value',
      accessor: 'Permissible Value',
      style: { whiteSpace: 'unset' },
      Cell: this.renderCell.bind(this),
    }];
    let data = tableData;
    if (search) {
      data = data.filter(row => row['Data Field'].includes(search) || row['Permissible Value'].includes(search));
    }
    return (
      <div className="MatchedChoices-table">
        <div className="MatchedChoices-tableTitle">
            <span className="MatchedChoices-searchBar">
          Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
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

MatchedChoices.propTypes = {
  tableData: PropTypes.array,
};

MatchedChoices.defaultProps = {
  tableData: [],
};


function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeChoiceMatch }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MatchedChoices);
