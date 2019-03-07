import React, { Component } from 'react';
import './ChoiceMatcher.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import ErrorSelector from '../../ErrorSelector/ErrorSelector';
import { matchChoices } from '../../../actions/RedcapLinterActions';

class ChoiceMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      choiceMap: {},
      noMatch: '',
      search: '',
      columns: [{
        title: 'Data Field',
        key: 'Data Field',
        render: (text, record) => (this.renderCell('Data Field', record)),
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

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      workingColumn,
      workingSheetName,
    } = prevState;
    if (nextProps.workingColumn !== workingColumn || nextProps.workingSheetName !== workingSheetName) {
      return { choiceMap: {} };
    }
    return null;
  }

  handleMatchAll(e) {
    const {
      choiceMap,
    } = this.state;
    const {
      matchChoices,
    } = this.props;
    matchChoices(choiceMap);
  }

  handleMatch(fieldToMatch) {
    const {
      choiceMap,
    } = this.state;
    const {
      matchChoices,
    } = this.props;
    const match = choiceMap[fieldToMatch] || '';
    const payload = {};
    payload[fieldToMatch] = match;
    matchChoices(payload);
  }

  handleNoMatch(fieldToMatch) {
    const {
      noMatch,
    } = this.state;
    const {
      matchChoices,
    } = this.props;
    const payload = {};
    payload[fieldToMatch] = noMatch;
    matchChoices(payload);
  }

  handleChange(fieldToMatch, e) {
    const {
      fieldErrors,
    } = this.props;
    const {
      choiceMap,
    } = this.state;
    if (fieldErrors && fieldErrors.fieldType === 'checkbox') {
      choiceMap[fieldToMatch] = e.map(choice => choice.value);
    } else {
      choiceMap[fieldToMatch] = e.value;
    }
    this.setState({ choiceMap });
  }

  renderCell(header, cellInfo) {
    return (
      <Cell
        cellData={cellInfo[header]}
        editable={false}
      />
    );
  }

  renderCandidates(cellInfo) {
    const {
      fieldErrors,
      ddData,
      workingColumn,
    } = this.props;
    const choiceCandidates = fieldErrors.choiceCandidates || {};
    const {
      choiceMap,
    } = this.state;
    const ddField = ddData.find(field => field.field_name === workingColumn);
    const fieldToMatch = cellInfo['Data Field'];
    const value = choiceMap[fieldToMatch];
    let selectedValue = [];
    if (Array.isArray(value)) {
      selectedValue = value.map(choice => ({
        value: choice,
        label: choice,
      }));
    } else if (value) {
      selectedValue = {
        value: value,
        label: value,
      };
    } else if (ddField.field_type === 'checkbox' && !value) {
      const checkboxItems = fieldToMatch.split(',').map(item => item.trim());
      const choices = Object.keys(ddField.choices_dict).map(choice => choice.toLowerCase());
      checkboxItems.forEach((item) => {
        if (choices.indexOf(item.toLowerCase()) >= 0) {
          selectedValue.push({
            value: item,
            label: item,
          });
        }
      });
    }
    let scores = choiceCandidates[fieldToMatch] || [];
    scores = scores.sort((a, b) => b.score - a.score);
    const options = scores.map(score => ({
      value: score.candidate,
      label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.choiceValue}</span></span>,
    }));
    options.push({
      value: null,
      label: 'None',
    });

    let isMulti = false;
    if (fieldErrors.fieldType === 'checkbox') {
      isMulti = true;
    }
    return (
      <Select
        options={options}
        isSearchable
        isMulti={isMulti}
        value={selectedValue}
        onChange={e => this.handleChange(fieldToMatch, e)}
        placeholder="Select..."
      />
    );
  }

  renderMatchButton(cellInfo) {
    const fieldToMatch = cellInfo['Data Field'];
    const {
      choiceMap,
    } = this.state;
    let disabled = true;
    if (choiceMap[fieldToMatch]) {
      disabled = false;
    }
    return (
      <div className="ChoiceMatcher-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleMatch(fieldToMatch, e)} className="App-submitButton">Match</button>
        <button type="button" onClick={e => this.handleNoMatch(fieldToMatch, e)} className="App-actionButton">No Match</button>
      </div>
    );
  }

  render() {
    const {
      fieldErrors,
      recordsMissingRequiredData,
      workingSheetName,
      workingColumn,
      dataFieldToChoiceMap,
      columnsInError,
    } = this.props;
    const {
      search,
      columns,
      choiceMap,
    } = this.state;

    let propsChoiceMap = {};
    if (dataFieldToChoiceMap[workingSheetName] && dataFieldToChoiceMap[workingSheetName][workingColumn]) {
      propsChoiceMap = dataFieldToChoiceMap[workingSheetName][workingColumn];
    }

    const tableData = fieldErrors.unmatchedChoices.reduce((filtered, f) => {
      if (!Object.keys(propsChoiceMap).includes(f)) {
        filtered.push({
          'Data Field': f,
        });
      }
      return filtered;
    }, []);


    let data = tableData;
    if (search) {
      data = data.filter(row => row['Data Field'].includes(search));
    }

    // {`${workingSheetName}: ${workingColumn}`}

    const disabled = Object.keys(choiceMap).length == 0;

    return (
      <div className="ChoiceMatcher-table">
        <div className="ChoiceMatcher-tableTitle">
          <span className="ChoiceMatcher-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
          <span className="ChoiceMatcher-tableLabel"><ErrorSelector /></span>
          <button type="button" disabled={disabled} onClick={this.handleMatchAll.bind(this)} className="App-submitButton ChoiceMatcher-matchAll">Match All</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

ChoiceMatcher.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
};

ChoiceMatcher.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchChoices }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChoiceMatcher);
