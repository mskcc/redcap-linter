import React, { Component } from 'react';
import './FieldMatcher.css';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Cell from '../Cell/Cell';

class FieldMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: '',
      data: [],
    };
  }

  renderCell(cellInfo) {
    const {
      editable,
    } = this.props;
    return (
      <Cell
        cellData={cellInfo.value}
        editable={editable}
      />
    );
  }

  renderCandidates(cellInfo) {
    const {
      fieldCandidates,
    } = this.props;
    const fieldToMatch = cellInfo.value;
    let scores = fieldCandidates[fieldToMatch]
    scores = scores.sort((a, b) => b.score - a.score);
    console.log(scores);
    const options = scores.map(score => ({
      value: score.candidate,
      label: score.candidate,
    }));
    const defaultOption = options[0];
    return (
      <Select
        options={options}
        defaultValue={defaultOption}
      />
    );
  }

  render() {
    const {
      fieldsToMatch,
    } = this.props;
    let columns = [{
      Header: '',
    }];
    const headers = ['REDCap Field', 'Candidate', 'Match'];
    columns = [{
      Header: 'REDCap Field',
      accessor: 'REDCap Field',
      Cell: this.renderCell.bind(this),
      // getProps: this.renderErrors.bind(this),
    },
    {
      Header: 'Candidate',
      accessor: 'Candidate',
      Cell: this.renderCandidates.bind(this),
      // getProps: this.renderErrors.bind(this),
    },
    {
      Header: 'Match',
      accessor: 'Match',
      Cell: this.renderCell.bind(this),
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

export default FieldMatcher;
