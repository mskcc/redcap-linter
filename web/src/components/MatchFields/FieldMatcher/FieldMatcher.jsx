import React, { Component } from 'react';
import './FieldMatcher.scss';
import '../../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { Table, Input, Switch, Icon } from 'antd';
import Cell from '../../Cell/Cell';
import { matchFields, highlightColumns } from '../../../actions/RedcapLinterActions';

class FieldMatcher extends Component {
  constructor(props) {
    super(props);
    const mode = 'REDCap Field';
    this.state = {
      redcapFieldToDataFieldMap: {},
      noMatch: '',
      search: '',
      selectedColumns: [],
      mode: mode,
      columns: [{
        title: mode,
        key: mode,
        render: (text, record) => (this.renderCell(mode, record)),
      },
      {
        title: 'Candidate',
        key: 'Candidate',
        width: '250px',
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
      mode,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    const payload = {};
    if (mode === 'REDCap Field') {
      payload[fieldToMatch] = redcapFieldToDataFieldMap[fieldToMatch];
    } else if (mode === 'Data Field') {
      const dataFieldToRedcapFieldMap = {};
      for (const redcapField in redcapFieldToDataFieldMap) {
        dataFieldToRedcapFieldMap[redcapFieldToDataFieldMap[redcapField]] = redcapField;
      }
      payload[dataFieldToRedcapFieldMap[fieldToMatch]] = fieldToMatch;
    }

    matchFields(payload);
  }

  handleNoMatch(fieldToMatch) {
    const {
      noMatch,
      mode,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    const payload = {};
    if (mode === 'REDCap Field') {
      payload[fieldToMatch] = noMatch;
    } else if (mode === 'Data Field') {
      payload[noMatch] = fieldToMatch;
    }
    matchFields(payload);
  }

  handleChange(fieldToMatch, e) {
    const {
      highlightColumns,
    } = this.props;
    const {
      redcapFieldToDataFieldMap,
      mode,
    } = this.state;
    if (mode === 'REDCap Field') {
      redcapFieldToDataFieldMap[fieldToMatch] = e.value;
    } else if (mode === 'Data Field') {
      let previouslyMatched = '';
      for (const redcapField in redcapFieldToDataFieldMap) {
        if (redcapFieldToDataFieldMap[redcapField] === fieldToMatch) {
          previouslyMatched = redcapField;
        }
      }
      if (previouslyMatched) {
        delete redcapFieldToDataFieldMap[previouslyMatched];
      }
      redcapFieldToDataFieldMap[e.value] = fieldToMatch;
    }
    const selectedColumns = Object.values(redcapFieldToDataFieldMap).reduce((filtered, dataField) => {
      if (dataField) {
        if (Array.isArray(dataField)) {
          console.log('pushAll');
        } else {
          filtered.push(dataField);
        }
      }
      return filtered;
    }, []);
    highlightColumns({ selectedColumns });
    this.setState({ redcapFieldToDataFieldMap });
  }

  onSwitchChange(e) {
    let {
      mode
    } = this.state;
    mode = mode === 'REDCap Field' ? 'Data Field' : 'REDCap Field';
    const columns = [{
      title: mode,
      key: mode,
      render: (text, record) => (this.renderCell(mode, record)),
    },
    {
      title: 'Candidate',
      key: 'Candidate',
      width: '250px',
      render: (text, record) => (this.renderCandidates(record)),
    },
    {
      title: 'Match',
      key: 'Match',
      render: (text, record) => (this.renderMatchButton(record)),
    }];
    this.setState({ mode, columns })
  }

  renderCell(header, cellInfo) {
    const {
      ddData,
      dataFieldToSheets,
    } = this.props;
    const {
      mode,
    } = this.state;
    let cellData = '';
    if (mode === 'REDCap Field') {
      const ddField = ddData.find(field => field.field_name === cellInfo[header]);
      cellData = <span><b>{cellInfo[mode]}</b> | {ddField.form_name}</span>;
    } else if (mode === 'Data Field') {
      cellData = <span><b>{cellInfo[mode]}</b> | {dataFieldToSheets[cellInfo[mode]].toString()}</span>;
    }
    return (
      <Cell
        cellData={cellData}
        editable={false}
      />
    );
  }

  renderCandidates(cellInfo) {
    const {
      redcapFieldCandidates,
      dataFieldCandidates,
    } = this.props;
    const {
      redcapFieldToDataFieldMap,
      mode,
    } = this.state;
    const fieldToMatch = cellInfo[mode];

    let value = '';
    if (mode === 'REDCap Field') {
      value = redcapFieldToDataFieldMap[fieldToMatch];
    } else if (mode === 'Data Field') {
      const dataFieldToRedcapFieldMap = {};
      for (const redcapField in redcapFieldToDataFieldMap) {
        dataFieldToRedcapFieldMap[redcapFieldToDataFieldMap[redcapField]] = redcapField;
      }
      value = dataFieldToRedcapFieldMap[fieldToMatch];
    }

    let selectedValue = '';
    if (value) {
      selectedValue = {
        value: value,
        label: value,
      };
    }

    let scores = [];
    let options = [];
    if (mode === 'REDCap Field') {
      scores = redcapFieldCandidates[fieldToMatch];
      scores = scores.sort((a, b) => b.score - a.score);
      const mappedDataFieldValues = Object.values(redcapFieldToDataFieldMap);
      options = scores.reduce((filtered, score) => {
        if (!mappedDataFieldValues.includes(score.candidate)) {
          filtered.push({
            value: score.candidate,
            label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.sheets.toString()}</span></span>,
          });
        }
        return filtered;
      }, []);
    } else if (mode === 'Data Field') {
      scores = dataFieldCandidates[fieldToMatch];
      scores = scores.sort((a, b) => b.score - a.score);
      const mappedRedcapFieldValues = Object.keys(redcapFieldToDataFieldMap);
      options = scores.reduce((filtered, score) => {
        if (!mappedRedcapFieldValues.includes(score.candidate)) {
          filtered.push({
            value: score.candidate,
            label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.form_name}</span></span>,
          });
        }
        return filtered;
      }, []);
    }

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
    const {
      redcapFieldToDataFieldMap,
      mode
    } = this.state;
    const fieldToMatch = cellInfo[mode];
    let disabled = true;
    if (mode === 'REDCap Field') {
      if (redcapFieldToDataFieldMap[fieldToMatch]) {
        disabled = false;
      }
    } else if (mode === 'Data Field') {
      const dataFieldToRedcapFieldMap = {};
      for (const redcapField in redcapFieldToDataFieldMap) {
        dataFieldToRedcapFieldMap[redcapFieldToDataFieldMap[redcapField]] = redcapField;
      }
      if (dataFieldToRedcapFieldMap[fieldToMatch]) {
        disabled = false;
      }
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
      redcapFieldCandidates,
      unmatchedRedcapFields,
      unmatchedDataFields,
      dataFieldToSheets,
      ddData,
    } = this.props;
    const {
      search,
      columns,
      redcapFieldToDataFieldMap,
      mode,
    } = this.state;
    let tableData = [];
    if (mode === 'REDCap Field') {
      tableData = unmatchedRedcapFields.map(f => {
        // TODO Handle multiple forms
        const ddField = ddData.find(field => field.field_name === f);
        return {
          'REDCap Field': f,
          'Form Name': ddField.form_name,
        };
      });
    } else if (mode === 'Data Field') {
      tableData = unmatchedDataFields.map(f => {
        // TODO Handle multiple forms
        const sheets = dataFieldToSheets[f];
        return {
          'Data Field': f,
          'Sheets': sheets.toString(),
        };
      });
    }

    let data = tableData;
    if (search) {
      if (mode === 'REDCap Field') {
        data = data.filter(row => row['REDCap Field'].includes(search) || row['Form Name'].includes(search));
      } else if (mode === 'Data Field') {
        data = data.filter(row => row['Data Field'].includes(search) || row['Sheets'].includes(search));
      }
    }

    const disabled = Object.keys(redcapFieldToDataFieldMap).length === 0;

    const iconType = mode === 'REDCap Field' ? 'arrow-right' : 'arrow-left';

    // <Switch className="FieldMatcher-switch" defaultChecked checkedChildren="REDCap -> Data Field" unCheckedChildren="Data -> REDCap Field" size="large" onChange={this.onSwitchChange.bind(this)} />
    return (
      <div className="FieldMatcher-table">
        <div className="FieldMatcher-tableActions">
          <div className="FieldMatcher-tableSearch">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </div>
          <div className="FieldMatcher-switch"><b>REDCap Field</b><button type="button" onClick={this.onSwitchChange.bind(this)} className="App-actionButton FieldMatcher-switchButton"><Icon type={iconType} /></button> <b>Data Field</b></div>
          <button type="button" disabled={disabled} onClick={this.handleMatchAll.bind(this)} className="App-submitButton FieldMatcher-matchAll">Match All</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

FieldMatcher.propTypes = {
  unmatchedRedcapFields: PropTypes.array,
  redcapFieldCandidates: PropTypes.object,
  dataFieldToSheets: PropTypes.object,
  editable: PropTypes.bool,
};

FieldMatcher.defaultProps = {
  unmatchedRedcapFields: [],
  redcapFieldCandidates: {},
  dataFieldToSheets: {},
  editable: true,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchFields, highlightColumns }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FieldMatcher);
