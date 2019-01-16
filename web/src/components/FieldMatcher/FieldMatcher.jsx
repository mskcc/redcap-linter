import React, { Component } from 'react';
import './FieldMatcher.css';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../Cell/Cell';
import { matchFields } from '../../actions/RedcapLinterActions';

class FieldMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redcapFieldToDataFieldMap: {},
      noMatch: '',
    };
  }

  handleMatch(fieldToMatch) {
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    const match = redcapFieldToDataFieldMap[fieldToMatch] || '';
    matchFields(fieldToMatch, match);
  }

  handleNoMatch(fieldToMatch) {
    const {
      noMatch,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    matchFields(fieldToMatch, noMatch);
  }

  handleChange(fieldToMatch, e) {
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    redcapFieldToDataFieldMap[fieldToMatch] = e.value;
    this.setState({ redcapFieldToDataFieldMap });
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
      fieldCandidates,
    } = this.props;
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    const redcapField = cellInfo.original['REDCap Field'];
    const value = redcapFieldToDataFieldMap[redcapField];
    let selectedValue = '';
    if (value) {
      selectedValue = {
        value: value,
        label: value,
      };
    }
    const fieldToMatch = cellInfo.value;
    let scores = fieldCandidates[fieldToMatch];
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
    const fieldToMatch = cellInfo.original['REDCap Field'];
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    let disabled = true;
    if (redcapFieldToDataFieldMap[fieldToMatch]) {
      disabled = false;
    }
    return (
      <div>
        <button type="button" disabled={disabled} onClick={e => this.handleMatch(fieldToMatch, e)} className="App-submitButton">Match</button>
        <button type="button" onClick={e => this.handleNoMatch(fieldToMatch, e)} className="FieldMatcher-noMatchButton">No Match</button>
      </div>
    );
  }

  render() {
    const {
      fieldsToMatch,
    } = this.props;
    let columns = [{
      Header: '',
    }];
    columns = [{
      Header: 'REDCap Field',
      accessor: 'REDCap Field',
      Cell: this.renderCell.bind(this),
      // getProps: this.renderErrors.bind(this),
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
      'REDCap Field': f,
      'Candidate': f,
      'Match': '',
    }));

    return (
      <div className="FieldMatcher-table">
        <ReactTable
          data={tableData}
          className="-striped -highlight"
          columns={columns}
          defaultPageSize={18}
          minRows={18}
        />
      </div>
    );
  }
}

FieldMatcher.propTypes = {
  fieldsToMatch: PropTypes.array,
  fieldCandidates: PropTypes.object,
  editable: PropTypes.bool,
};

FieldMatcher.defaultProps = {
  fieldsToMatch: [],
  fieldCandidates: {},
  editable: true,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchFields }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FieldMatcher);
