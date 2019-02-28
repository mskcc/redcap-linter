import React, { Component } from 'react';
import './FieldMatcher.scss';
import '../../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { Table, Input } from 'antd';
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
        title: 'REDCap Field',
        key: 'REDCap Field',
        render: (text, record) => (this.renderCell('REDCap Field', record)),
      },
      {
        title: 'Candidate',
        key: 'Candidate',
        width: '200px',
        render: (text, record) => (this.renderCandidates(record)),
      },
      {
        title: 'Match',
        key: 'Match',
        render: (text, record) => (this.renderMatchButton(record)),
      }],
    };
  }

  handleMatchAll(e) {
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    matchFields(redcapFieldToDataFieldMap);
  }

  handleMatch(fieldToMatch) {
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    const match = redcapFieldToDataFieldMap[fieldToMatch] || '';
    const payload = { };
    payload[fieldToMatch] = match;
    matchFields(payload);
  }

  handleNoMatch(fieldToMatch) {
    const {
      noMatch,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    const payload = { };
    payload[fieldToMatch] = noMatch;
    matchFields(payload);
  }

  handleChange(fieldToMatch, e) {
    const {
      redcapFieldToDataFieldMap,
    } = this.state;
    redcapFieldToDataFieldMap[fieldToMatch] = e.value;
    this.setState({ redcapFieldToDataFieldMap });
  }

  renderCell(header, cellInfo) {
    const {
      ddData,
    } = this.props;
    const ddField = ddData.find(field => field.field_name === cellInfo[header]);
    const cellData = <span><b>{cellInfo[header]}</b> | {ddField.form_name}</span>;
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
    const fieldToMatch = cellInfo['REDCap Field'];
    const value = redcapFieldToDataFieldMap[fieldToMatch];
    let selectedValue = '';
    if (value) {
      selectedValue = {
        value: value,
        label: value,
      };
    }
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
        style={{ minWidth: '200px' }}
        onChange={e => this.handleChange(fieldToMatch, e)}
        styles={selectStyles}
        placeholder="Select..."
      />
    );
  }

  renderMatchButton(cellInfo) {
    const fieldToMatch = cellInfo['REDCap Field'];
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
      ddData,
    } = this.props;
    const {
      search,
      columns,
      redcapFieldToDataFieldMap,
    } = this.state;
    const tableData = fieldsToMatch.map(f => {
      // TODO Handle multiple forms
      const ddField = ddData.find(field => field.field_name === f);
      return {
        'REDCap Field': f,
        'Candidate': f,
        'Form Name': ddField.form_name,
        'Match': '',
      };
    });
    let data = tableData;
    if (search) {
      data = data.filter(row => row['REDCap Field'].includes(search) || row['Form Name'].includes(search));
    }

    const disabled = Object.keys(redcapFieldToDataFieldMap).length === 0;


    return (
      <div className="FieldMatcher-table">
        <div className="App-tableActions">
          Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          <button type="button" disabled={disabled} onClick={this.handleMatchAll.bind(this)} className="App-submitButton FieldMatcher-matchAll">Match All</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
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
