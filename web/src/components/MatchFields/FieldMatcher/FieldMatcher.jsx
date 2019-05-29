import React, { Component } from 'react';
import './FieldMatcher.scss';
import '../../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import _ from 'lodash';
import { Table, Input, Switch, Icon } from 'antd';
import Cell from '../../Cell/Cell';
import { matchFields, highlightColumns } from '../../../actions/REDCapLinterActions';

class FieldMatcher extends Component {
  constructor(props) {
    super(props);
    const mode = 'REDCap Field';
    this.state = {
      matchedFieldMap: {},
      noMatchRedcapFields: [],
      noMatch: '',
      search: '',
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

  onSwitchChange(e) {
    let {
      mode,
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
    this.setState({ mode, columns });
  }

  // This function is terrible, fix it
  handleChange(fieldToMatch, sheetToMatch, e, action) {
    // TODO Incorporate sheet in this
    const {
      highlightColumns,
      matchedFieldMap,
    } = this.props;
    const {
      noMatchRedcapFields,
      mode,
    } = this.state;
    if (mode === 'REDCap Field') {
      if (action.action === 'remove-value') {
        const selectedOption = action.removedValue;
        const field = selectedOption.value;
        const sheets = selectedOption.sheets;
        const sheetMap = matchedFieldMap[sheets[0]];
        if (sheetMap && sheetMap[field]) {
          delete sheetMap[field];
        }
      } else if (action.action === 'select-option' || action.action === 'deselect-option') {
        let selectedOption = action.option
        if (!action.option) {
          selectedOption = e;
        }
        const field = selectedOption.value;
        if (field === null) {
          // TODO noMatchFields
          noMatchRedcapFields.push(fieldToMatch);
        } else {
          const sheets = selectedOption.sheets;
          const sheetMap = matchedFieldMap[sheets[0]];
          let previouslyMatched = null;
          if (sheetMap && _.invert(sheetMap)[fieldToMatch]) {
            previouslyMatched = _.invert(sheetMap)[fieldToMatch];
            delete sheetMap[previouslyMatched];
          }
          const sheet = selectedOption.sheets[0];
          if (!matchedFieldMap[sheet]) {
            matchedFieldMap[sheet] = {};
          }
          if (noMatchRedcapFields.includes(fieldToMatch)) {
            const idx = noMatchRedcapFields.indexOf(fieldToMatch);
            if (idx !== -1) noMatchRedcapFields.splice(idx, 1);
          }
          matchedFieldMap[sheet][field] = fieldToMatch;
        }
      } else if (action.action === 'clear') {
        Object.keys(matchedFieldMap).forEach((sheet) => {
          const previouslyMatched = _.invert(matchedFieldMap[sheet])[fieldToMatch];
          if (previouslyMatched) {
            delete matchedFieldMap[sheet][previouslyMatched];
          }
        });
      }
    } else if (mode === 'Data Field') {
      if (!matchedFieldMap[sheetToMatch]) {
        matchedFieldMap[sheetToMatch] = {};
      }
      matchedFieldMap[sheetToMatch][fieldToMatch] = e.value;
    }
    highlightColumns({ matchedFieldMap });
    this.setState({ noMatchRedcapFields });
  }

  acceptMatches(e) {
    // TODO send noMatchRedcapFields
    const {
      noMatchRedcapFields,
    } = this.state;
    const {
      matchedFieldMap,
      matchFields,
    } = this.props;
    const payload = {
      dataFieldToRedcapFieldMap: matchedFieldMap,
      noMatchRedcapFields: noMatchRedcapFields,
    }
    matchFields(payload);
  }


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
      matchedFieldMap,
    } = this.props;
    // console.log(this.props);
    const {
      mode,
      noMatchRedcapFields,
    } = this.state;
    // console.log(cellInfo);
    const fieldToMatch = cellInfo[mode];
    let sheetToMatch = '';
    let selectedValue = '';
    let isMulti = false;

    let value = '';
    if (mode === 'REDCap Field') {
      isMulti = true;
      // TODO Finish implementation for No Match
      if (noMatchRedcapFields.includes(fieldToMatch)) {
        isMulti = false;
        value = null;
      } else {
        Object.keys(matchedFieldMap).forEach((sheet) => {
          value = _.invert(matchedFieldMap[sheet])[fieldToMatch];
          if (value) {
            if (!selectedValue) {
              selectedValue = [];
            }
            selectedValue.push({
              value: value,
              label: <span><b>{value}</b> | <span style={{ fontWeight: 'lighter' }}>{sheet}</span></span>,
              sheets: [sheet],
            });
          }
        });
      }
    } else if (mode === 'Data Field') {
      sheetToMatch = cellInfo['Sheets'];
      if (matchedFieldMap[sheetToMatch]) {
        value = matchedFieldMap[sheetToMatch][fieldToMatch];

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

    let scores = [];
    let options = [];
    if (mode === 'REDCap Field') {
      scores = redcapFieldCandidates[fieldToMatch];
      scores = scores.sort((a, b) => b.score - a.score);
      options = scores.reduce((filtered, score) => {
        const sheet = score.sheets[0];
        if (!(matchedFieldMap[sheet] && matchedFieldMap[sheet][score.candidate])) {
          // Figure out how to make this searchable
          filtered.push({
            value: score.candidate,
            label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.sheets.toString()}</span></span>,
            sheets: score.sheets,
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
      const mappedRedcapFieldValues = Object.values(matchedFieldMap);
      options = scores.reduce((filtered, score) => {
        if (!mappedRedcapFieldValues.includes(score.candidate)) {
          filtered.push({
            value: score.candidate,
            label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.form_name}</span></span>,
          });
        }
        return filtered;
      }, []);
      options.push({
        value: null,
        label: 'None',
      });
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
        hideSelectedOptions={false}
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

  render() {
    const {
      redcapFieldCandidates,
      unmatchedRedcapFields,
      unmatchedDataFields,
      dataFieldToRedcapFieldMap,
      ddData,
      matchedFieldMap,
      showModal,
    } = this.props;
    const {
      search,
      columns,
      mode,
      noMatchRedcapFields,
    } = this.state;
    let tableData = [];
    if (mode === 'REDCap Field') {
      tableData = unmatchedRedcapFields.reduce((filtered, f) => {
        // TODO Handle multiple forms
        const ddField = ddData.find(field => field.field_name === f);
        filtered.push({
          'REDCap Field': f,
          'Form Name': ddField.form_name,
        });
        return filtered;
      }, []);
    } else if (mode === 'Data Field') {
      tableData = Object.keys(unmatchedDataFields).reduce((filtered, sheet) => {
        // TODO Handle multiple forms
        unmatchedDataFields[sheet].forEach((dataField) => {
          filtered.push({
            'Data Field': dataField,
            'Sheets': sheet,
          });
        })
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

    if (showModal) {
      if (mode === 'REDCap Field') {
        data = data.filter((row) => {
          const redcapField = row["REDCap Field"];
          let unsaved = false;
          Object.keys(matchedFieldMap).forEach((sheet) => {
            if (Object.values(matchedFieldMap[sheet]).includes(redcapField) && !Object.values(dataFieldToRedcapFieldMap[sheet]).includes(redcapField)) {
              unsaved = true;
            }
          });
          return unsaved;
        });
      } else if (mode === 'Data Field') {
        data = data.filter((row) => {
          const dataField = row["Data Field"];
          let unsaved = false;
          Object.keys(matchedFieldMap).forEach((sheet) => {
            if (matchedFieldMap[sheet][dataField] && !dataFieldToRedcapFieldMap[sheet][dataField]) {
              unsaved = true;
            }
          });
          return unsaved;
        });
      }
    }

    const disabled = Object.keys(matchedFieldMap).length === 0 && noMatchRedcapFields.length === 0;

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
  dataFieldToRedcapFieldMap: PropTypes.object,
  matchedFieldMap: PropTypes.object,
  editable: PropTypes.bool,
};

FieldMatcher.defaultProps = {
  unmatchedRedcapFields: [],
  redcapFieldCandidates: {},
  dataFieldToRedcapFieldMap: {},
  matchedFieldMap: {},
  editable: true,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchFields, highlightColumns }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FieldMatcher);
