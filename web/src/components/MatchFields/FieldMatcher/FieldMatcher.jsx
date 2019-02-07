import React, { Component } from 'react';
import './FieldMatcher.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { matchFields } from '../../../actions/RedcapLinterActions';

class FieldMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redcapFieldToDataFieldMap: {},
      noMatch: '',
      search: '',
      columns: [{
        Header: 'REDCap Field',
        accessor: 'REDCap Field',
        Cell: this.renderCell.bind(this),
      },
      {
        Header: 'Candidate',
        accessor: 'Candidate',
        style: { overflow: 'visible' },
        Cell: this.renderCandidates.bind(this),
      },
      {
        Header: 'Match',
        accessor: 'Match',
        style: { overflow: 'visible' },
        Cell: this.renderMatchButton.bind(this),
      }],
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
    const {
      ddData,
    } = this.props;
    const ddField = ddData.find(field => field.field_name === cellInfo.value);
    const cellData = <span><b>{cellInfo.value}</b> | {ddField.form_name}</span>;
    return (
      <Cell
        cellData={cellData}
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
    const mappedDataFieldValues = Object.values(redcapFieldToDataFieldMap);
    const options = scores.reduce((filtered, score) => {
      if (!mappedDataFieldValues.includes(score.candidate)) {
        filtered.push({
          value: score.candidate,
          label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.sheets.toString()}</span></span>,
        });
      }
      return filtered;
    }, []);

    const longestOption = scores.map(score => score.candidate).sort((a, b) => b.length - a.length)[0];
    const selectWidth = 8 * longestOption.length + 60;

    const selectStyles = {
      control: provided => ({
        ...provided,
      }),
      menu: provided => ({
        // none of react-select's styles are passed to <Control />
        ...provided,
        overflow: 'visible',
        minWidth: `${selectWidth}px`,
      }),
    };
    return (
      <Select
        options={options}
        isSearchable
        value={selectedValue}
        onChange={e => this.handleChange(fieldToMatch, e)}
        styles={selectStyles}
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
      <div className="FieldMatcher-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleMatch(fieldToMatch, e)} className="App-submitButton">Match</button>
        <button type="button" onClick={e => this.handleNoMatch(fieldToMatch, e)} className="App-actionButton">No Match</button>
      </div>
    );
  }

  render() {
    const {
      fieldsToMatch,
    } = this.props;
    const {
      search,
      columns,
    } = this.state;
    const tableData = fieldsToMatch.map(f => ({
      'REDCap Field': f,
      'Candidate': f,
      'Match': '',
    }));
    let data = tableData;
    if (search) {
      data = data.filter(row => row['REDCap Field'].includes(search));
    }

    return (
      <div className="FieldMatcher-table">
        Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
        <ReactTable
          data={data}
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
