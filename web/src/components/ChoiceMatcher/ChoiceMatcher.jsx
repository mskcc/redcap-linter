import React, { Component } from 'react';
import './ChoiceMatcher.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../Cell/Cell';
import { matchChoices } from '../../actions/RedcapLinterActions';

class ChoiceMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataFieldToChoiceMap: {},
      noMatch: '',
      search: '',
    };
  }

  handleMatch(fieldToMatch) {
    const {
      dataFieldToChoiceMap,
    } = this.state;
    const {
      matchChoices,
    } = this.props;
    const match = dataFieldToChoiceMap[fieldToMatch] || '';
    matchChoices(fieldToMatch, match);
  }

  handleNoMatch(fieldToMatch) {
    const {
      noMatch,
    } = this.state;
    const {
      matchChoices,
    } = this.props;
    matchChoices(fieldToMatch, noMatch);
  }

  handleChange(fieldToMatch, e) {
    const {
      dataFieldToChoiceMap,
    } = this.state;
    dataFieldToChoiceMap[fieldToMatch] = e.value;
    this.setState({ dataFieldToChoiceMap });
  }

  renderCell(cellInfo) {
    return (
      <Cell
        cellData={cellInfo.value}
        editable={false}
      />
    );
  }

  renderCandidates(cellInfo) {
    const {
      fieldErrors,
    } = this.props;
    const choiceCandidates = fieldErrors.choiceCandidates || {};
    const {
      dataFieldToChoiceMap,
    } = this.state;
    const dataField = cellInfo.original['Data Field'];
    const value = dataFieldToChoiceMap[dataField];
    let selectedValue = '';
    if (value) {
      selectedValue = {
        value: value,
        label: value,
      };
    }
    const fieldToMatch = cellInfo.value;
    let scores = choiceCandidates[fieldToMatch];
    scores = scores.sort((a, b) => b.score - a.score);
    const options = scores.map(score => ({
      value: score.candidate,
      label: score.candidate,
    }));
    return (
      <Select
        options={options}
        isSearchable
        value={selectedValue}
        onChange={e => this.handleChange(fieldToMatch, e)}
        placeholder="Select..."
      />
    );
  }

  renderMatchButton(cellInfo) {
    const fieldToMatch = cellInfo.original['Data Field'];
    const {
      dataFieldToChoiceMap,
    } = this.state;
    let disabled = true;
    if (dataFieldToChoiceMap[fieldToMatch]) {
      disabled = false;
    }
    return (
      <div className="ChoiceMatcher-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleMatch(fieldToMatch, e)} className="App-submitButton">Match</button>
        <button type="button" onClick={e => this.handleNoMatch(fieldToMatch, e)} className="ChoiceMatcher-noMatchButton">No Match</button>
      </div>
    );
  }

  render() {
    const {
      fieldsToMatch,
    } = this.props;
    const {
      search,
    } = this.state;
    const columns = [{
      Header: 'Data Field',
      accessor: 'Data Field',
      Cell: this.renderCell.bind(this),
    },
    {
      Header: 'Candidate',
      accessor: 'Candidate',
      style: { overflow: 'visible' },
      Cell: this.renderCandidates.bind(this),
      // getProps: this.renderErrors.bind(this),
    },
    {
      Header: 'Match',
      accessor: 'Match',
      style: { overflow: 'visible' },
      Cell: this.renderMatchButton.bind(this),
      // getProps: this.renderErrors.bind(this),
    }];
    const tableData = fieldsToMatch.map(f => ({
      'Data Field': f,
      'Candidate': f,
      'Match': '',
    }));
    let data = tableData;
    if (search) {
      data = data.filter(row => row['Data Field'].includes(search));
    }

    return (
      <div className="ChoiceMatcher-table">
        Search: <input value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
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

ChoiceMatcher.propTypes = {
  fieldsToMatch: PropTypes.array,
  fieldErrors: PropTypes.object,
};

ChoiceMatcher.defaultProps = {
  fieldsToMatch: [],
  fieldErrors: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchChoices }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChoiceMatcher);
