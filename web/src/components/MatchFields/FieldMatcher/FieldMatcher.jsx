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
      fieldMap: {},
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
        title: `${mode} Candidate`,
        key: `${mode} Candidate`,
        width: '250px',
        render: (text, record) => (this.renderCandidates(record)),
      }],
    };
  }

  // ,
  // {
  //   title: 'Match',
  //   key: 'Match',
  //   render: (text, record) => (this.renderMatchButton(record)),
  // }

  acceptMatches(e) {
    const {
      fieldMap,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    matchFields(fieldMap);
  }

  handleMatch(fieldToMatch) {
    const {
      fieldMap,
      mode,
    } = this.state;
    const {
      matchFields,
    } = this.props;
    const payload = {};
    if (mode === 'REDCap Field') {
      payload[fieldToMatch] = fieldMap[fieldToMatch];
    } else if (mode === 'Data Field') {
      const dataFieldToRedcapFieldMap = {};
      for (const redcapField in fieldMap) {
        dataFieldToRedcapFieldMap[fieldMap[redcapField]] = redcapField;
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

  // This function is terrible, fix it
  handleChange(fieldToMatch, sheetToMatch, e, action) {
    // TODO Incorporate sheet in this
    const {
      highlightColumns,
    } = this.props;
    const {
      fieldMap,
      mode,
    } = this.state;
    if (action && action.removedValue) {
      const {
        field,
        sheets,
      } = action.removedValue.value;
      if (fieldMap[sheets[0]] && fieldMap[sheets[0]][fieldToMatch]) {
        delete fieldMap[sheets[0]][fieldToMatch];
      }
    }
    if (mode === 'REDCap Field') {
      if (e.length > 0) {
        e.forEach((option) => {
          const sheet = option.value.sheets[0];
          if (!fieldMap[sheet]) {
            fieldMap[sheet] = {};
          }
          fieldMap[sheet][fieldToMatch] = option.value.field;
        });
      }
      // fieldMap[fieldToMatch] = e.value;
    } else if (mode === 'Data Field') {
      if (!fieldMap[sheetToMatch]) {
        fieldMap[sheetToMatch] = {};
      }

      let previouslyMatched = '';
      Object.keys(fieldMap[sheetToMatch]).forEach((redcapField) => {
        if (fieldMap[sheetToMatch][redcapField] === fieldToMatch) {
          previouslyMatched = redcapField;
        }
      });
      if (previouslyMatched) {
        delete fieldMap[sheetToMatch][previouslyMatched];
      }
      fieldMap[sheetToMatch][e.value] = fieldToMatch;
    }
    const selectedColumns = Object.values(fieldMap).reduce((filtered, dataField) => {
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
    this.setState({ fieldMap });
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
      title: `${mode} Candidate`,
      key: `${mode} Candidate`,
      width: '250px',
      render: (text, record) => (this.renderCandidates(record)),
    }];
    this.setState({ mode, columns })
  }

  // ,
  // {
  //   title: 'Match',
  //   key: 'Match',
  //   render: (text, record) => (this.renderMatchButton(record)),
  // }

  renderCell(header, cellInfo) {
    const {
      ddData,
    } = this.props;
    const {
      mode,
    } = this.state;
    let cellData = '';
    if (mode === 'REDCap Field') {
      const ddField = ddData.find(field => field.field_name === cellInfo[header]);
      cellData = <span><b>{cellInfo[mode]}</b> | {ddField.form_name}</span>;
    } else if (mode === 'Data Field') {
      cellData = <span><b>{cellInfo[mode]}</b> | {cellInfo['Sheets']}</span>;
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
    // console.log(this.props);
    const {
      fieldMap,
      mode,
    } = this.state;
    // console.log(this.state);
    // console.log(cellInfo);
    const fieldToMatch = cellInfo[mode];
    let sheetToMatch = '';
    let selectedValue = '';
    let isMulti = false;

    let value = '';
    if (mode === 'REDCap Field') {
      isMulti = true;
      value = fieldMap[fieldToMatch];
      Object.keys(fieldMap).forEach((sheet) => {
        value = fieldMap[sheet][fieldToMatch];
        if (value) {
          if (!selectedValue) {
            selectedValue = [];
          }
          selectedValue.push({
            value: {
              field: value,
              sheets: [sheet],
            },
            label: <span><b>{value}</b> | <span style={{ fontWeight: 'lighter' }}>{sheet}</span></span>,
          });
        }
      });
    } else if (mode === 'Data Field') {
      sheetToMatch = cellInfo['Sheets'];

      // Reverse the map
      const dataFieldToRedcapFieldMap = {};
      if (fieldMap[sheetToMatch]) {
        Object.keys(fieldMap[sheetToMatch]).forEach((redcapField) => {
          dataFieldToRedcapFieldMap[fieldMap[sheetToMatch][redcapField]] = redcapField;
        })

        value = dataFieldToRedcapFieldMap[fieldToMatch];

        if (value) {
          selectedValue = {
            value: value,
            label: value,
          };
        }
      }
    }

    if (value === null) {
      selectedValue = {
        value: '',
        label: 'None',
      };
    }

    // console.log(selectedValue)

    let scores = [];
    let options = [];
    if (mode === 'REDCap Field') {
      scores = redcapFieldCandidates[fieldToMatch];
      scores = scores.sort((a, b) => b.score - a.score);
      const mappedDataFieldValues = Object.values(fieldMap);
      options = scores.reduce((filtered, score) => {
        if (!mappedDataFieldValues.includes(score.candidate)) {
          filtered.push({
            value: {
              field: score.candidate,
              sheets: score.sheets,
            },
            label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.sheets.toString()}</span></span>,
          });
        }
        return filtered;
      }, []);
      options.push({
        value: null,
        label: 'None',
      });
    } else if (mode === 'Data Field') {
      scores = dataFieldCandidates[fieldToMatch];
      scores = scores.sort((a, b) => b.score - a.score);
      const mappedRedcapFieldValues = Object.keys(fieldMap);
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
        zIndex: 20,
        overflow: 'visible',
        minWidth: `${selectWidth}px`,
      }),
    };
    return (
      <Select
        options={options}
        isSearchable
        isMulti={isMulti}
        value={selectedValue}
        style={{ minWidth: '200px' }}
        onChange={(e, action) => this.handleChange(fieldToMatch, sheetToMatch, e, action)}
        styles={selectStyles}
        placeholder="Select..."
      />
    );
  }

  renderMatchButton(cellInfo) {
    const {
      fieldMap,
      mode
    } = this.state;
    // console.log(cellInfo);
    const fieldToMatch = cellInfo[mode];
    let sheetToMatch = '';
    let disabled = true;
    if (mode === 'REDCap Field') {
      if (fieldMap[fieldToMatch]) {
        disabled = false;
      }
    } else if (mode === 'Data Field') {
      sheetToMatch = cellInfo['Sheets'];
      const dataFieldToRedcapFieldMap = {};
      for (const redcapField in fieldMap) {
        dataFieldToRedcapFieldMap[fieldMap[redcapField]] = redcapField;
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
      redcapFieldToDataFieldMap,
      ddData,
    } = this.props;
    const {
      search,
      columns,
      fieldMap,
      mode,
    } = this.state;
    let tableData = [];
    if (mode === 'REDCap Field') {
      tableData = unmatchedRedcapFields.reduce((filtered, f) => {
        // TODO Handle multiple forms
        const ddField = ddData.find(field => field.field_name === f);
        if (!Object.keys(redcapFieldToDataFieldMap).includes(f)) {
          filtered.push({
            'REDCap Field': f,
            'Form Name': ddField.form_name,
          });
        }
        return filtered;
      }, []);
    } else if (mode === 'Data Field') {
      tableData = unmatchedDataFields.reduce((filtered, f) => {
        // TODO Handle multiple forms
        if (f) {
          const sheets = dataFieldToSheets[f];
          sheets.forEach((sheet) => {
            filtered.push({
              'Data Field': f,
              'Sheets': sheet,
            });
          })
        }
        return filtered;
      }, []);
    }

    let data = tableData;
    if (search) {
      if (mode === 'REDCap Field') {
        data = data.filter(row => row['REDCap Field'].includes(search) || row['Form Name'].includes(search));
      } else if (mode === 'Data Field') {
        data = data.filter(row => row['Data Field'].includes(search) || row['Sheets'].includes(search));
      }
    }

    const disabled = Object.keys(fieldMap).length === 0;

    const iconType = 'swap';
    const redcapField = mode === 'REDCap Field' ? <b>REDCap Field</b> : <span>REDCap Field</span>;
    const dataField = mode === 'REDCap Field' ? <span>Data Field</span> : <b>Data Field</b>;

    // <Switch className="FieldMatcher-switch" defaultChecked checkedChildren="REDCap -> Data Field" unCheckedChildren="Data -> REDCap Field" size="large" onChange={this.onSwitchChange.bind(this)} />
    return (
      <div className="FieldMatcher-table">
        <div className="FieldMatcher-tableActions">
          <div className="FieldMatcher-tableSearch">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </div>
          <div className="FieldMatcher-switch">
            { redcapField }
            <button type="button" onClick={this.onSwitchChange.bind(this)} className="App-actionButton FieldMatcher-switchButton">
              <Icon type={iconType} />
            </button>
            { dataField }
          </div>
          <button type="button" disabled={disabled} onClick={this.acceptMatches.bind(this)} className="App-submitButton FieldMatcher-matchAll">Accept Matches</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }} />
      </div>
    );
  }
}

FieldMatcher.propTypes = {
  unmatchedRedcapFields: PropTypes.array,
  redcapFieldCandidates: PropTypes.object,
  redcapFieldToDataFieldMap: PropTypes.object,
  dataFieldToSheets: PropTypes.object,
  editable: PropTypes.bool,
};

FieldMatcher.defaultProps = {
  unmatchedRedcapFields: [],
  redcapFieldCandidates: {},
  redcapFieldToDataFieldMap: {},
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
