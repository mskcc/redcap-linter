import React, { Component } from 'react';
import './ChoiceMatcher.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { matchChoices, highlightChoices } from '../../../actions/REDCapLinterActions';
import { calculateSelectStyles } from '../../../utils/utils';

class ChoiceMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Data Field',
          key: 'Data Field',
          render: (text, record) => <Cell cellData={record['Data Field']} />,
        },
        {
          title: 'Candidate',
          key: 'Candidate',
          width: '250px',
          render: (text, record) => this.renderCandidates(record),
        },
        {
          title: 'Action',
          key: 'Action',
          width: 200,
          render: (text, record) => this.renderMatchButton(record),
        },
      ],
    };

    this.acceptMatches = this.acceptMatches.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      matchedChoiceMap,
      fieldErrors,
      ddData,
      workingSheetName,
      workingColumn,
      dataFieldToChoiceMap,
      highlightChoices,
      matchChoices,
    } = nextProps;

    if (
      workingColumn !== prevState.workingColumn
      || workingSheetName !== prevState.workingSheetName
    ) {
      let savedChoiceMap = {};
      if (
        dataFieldToChoiceMap[workingSheetName]
        && dataFieldToChoiceMap[workingSheetName][workingColumn]
      ) {
        savedChoiceMap = dataFieldToChoiceMap[workingSheetName][workingColumn];
      }

      const completeMatches = [];
      const ddField = ddData.find(field => field.field_name === workingColumn);
      if (ddField.field_type === 'checkbox') {
        matchedChoiceMap[workingSheetName] = matchedChoiceMap[workingSheetName] || {};
        matchedChoiceMap[workingSheetName][workingColumn] = matchedChoiceMap[workingSheetName][workingColumn] || {};
        const unmatchedChoices = fieldErrors.unmatchedChoices.reduce((filtered, f) => {
          if (!Object.keys(savedChoiceMap).includes(f)) {
            filtered.push(f);
          }
          return filtered;
        }, []);
        unmatchedChoices.forEach((unmatchedChoice) => {
          const checkboxItems = unmatchedChoice.split(',').map(item => item.trim());
          const choices = Object.keys(ddField.choices_dict).map(choice => choice.toLowerCase());
          const choiceMap = {};
          Object.keys(ddField.choices_dict).forEach((choice) => {
            choiceMap[choice.toLowerCase()] = choice;
          });
          if (!matchedChoiceMap[workingSheetName][workingColumn][unmatchedChoice]) {
            const tokenMatches = [];
            checkboxItems.forEach((item) => {
              if (choices.includes(item.toLowerCase())) {
                const matchingItem = choiceMap[item.toLowerCase()];
                if (!tokenMatches.includes(matchingItem)) {
                  tokenMatches.push(matchingItem);
                }
              }
            });
            if (tokenMatches.length > 0) {
              matchedChoiceMap[workingSheetName][workingColumn][unmatchedChoice] = tokenMatches;
            }
            if (tokenMatches.length === checkboxItems.length) {
              completeMatches.push(unmatchedChoice);
            }
          }
        });

        highlightChoices({ matchedChoiceMap });
        if (completeMatches.length > 0) {
          matchChoices({ matchedChoiceMap, fields: completeMatches });
        }
      }
    }

    if (
      workingColumn !== prevState.workingColumn
      || workingSheetName !== prevState.workingSheetName
    ) {
      return {
        workingColumn,
        workingSheetName,
      };
    }
    return null;
  }

  handleMatch(fieldToMatch) {
    const { matchedChoiceMap, matchChoices } = this.props;
    matchChoices({ matchedChoiceMap, fields: [fieldToMatch] });
  }

  handleNoMatch(fieldToMatch) {
    const {
      matchedChoiceMap, workingSheetName, workingColumn, matchChoices,
    } = this.props;
    matchedChoiceMap[workingSheetName] = matchedChoiceMap[workingSheetName] || [];
    matchedChoiceMap[workingSheetName][workingColumn] = matchedChoiceMap[workingSheetName][workingColumn] || [];
    matchedChoiceMap[workingSheetName][workingColumn][fieldToMatch] = '';
    matchChoices({ matchedChoiceMap, fields: [fieldToMatch] });
  }

  acceptMatches() {
    const { matchedChoiceMap, matchChoices } = this.props;
    matchChoices({ matchedChoiceMap });
  }

  handleChange(fieldToMatch, e) {
    const {
      matchedChoiceMap,
      workingSheetName,
      workingColumn,
      fieldErrors,
      highlightChoices,
    } = this.props;
    matchedChoiceMap[workingSheetName] = matchedChoiceMap[workingSheetName] || {};
    matchedChoiceMap[workingSheetName][workingColumn] = matchedChoiceMap[workingSheetName][workingColumn] || {};
    const choiceMap = matchedChoiceMap[workingSheetName][workingColumn];
    if (fieldErrors && fieldErrors.fieldType === 'checkbox') {
      choiceMap[fieldToMatch] = e.map(choice => choice.value);
    } else {
      choiceMap[fieldToMatch] = e.value;
    }
    highlightChoices({ matchedChoiceMap });
  }

  renderMatchButton(cellInfo) {
    const fieldToMatch = cellInfo['Data Field'];
    const { matchedChoiceMap, workingSheetName, workingColumn } = this.props;
    let disabled = true;
    if (matchedChoiceMap[workingSheetName] && matchedChoiceMap[workingSheetName][workingColumn]) {
      if (matchedChoiceMap[workingSheetName][workingColumn][fieldToMatch]) {
        disabled = false;
      }
    }
    return (
      <div className="ChoiceMatcher-buttons">
        <button
          type="button"
          disabled={disabled}
          onClick={e => this.handleMatch(fieldToMatch, e)}
          className="App-submitButton"
        >
          Match
        </button>
        <button
          type="button"
          onClick={e => this.handleNoMatch(fieldToMatch, e)}
          className="App-actionButton"
        >
          No Match
        </button>
      </div>
    );
  }

  renderCandidates(cellInfo) {
    const {
      matchedChoiceMap, fieldErrors, ddData, workingSheetName, workingColumn,
    } = this.props;
    const choiceCandidates = fieldErrors.choiceCandidates || {};
    const ddField = ddData.find(field => field.field_name === workingColumn);
    const fieldToMatch = cellInfo['Data Field'];
    let value = '';
    if (matchedChoiceMap[workingSheetName] && matchedChoiceMap[workingSheetName][workingColumn]) {
      value = matchedChoiceMap[workingSheetName][workingColumn][fieldToMatch];
    }
    let selectedValue = [];
    if (Array.isArray(value)) {
      selectedValue = value.map(choice => ({
        value: choice,
        label: choice,
      }));
    } else if (value) {
      selectedValue = {
        value,
        label: value,
      };
    } else if (value === null) {
      selectedValue = {
        value: '',
        label: 'None',
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
      label: (
        <span>
          <b>{score.candidate}</b>
          <span style={{ fontWeight: 'lighter' }}>{` | ${score.choiceValue}`}</span>
        </span>
      ),
    }));
    options.push({
      value: null,
      label: 'None',
    });

    let isMulti = false;
    if (fieldErrors.fieldType === 'checkbox') {
      isMulti = true;
    }

    const selectStyles = calculateSelectStyles(options);

    return (
      <Select
        options={options}
        isSearchable
        isMulti={isMulti}
        styles={selectStyles}
        value={selectedValue}
        onChange={e => this.handleChange(fieldToMatch, e)}
        placeholder="Select..."
      />
    );
  }

  render() {
    const {
      matchedChoiceMap,
      fieldErrors,
      workingSheetName,
      workingColumn,
      dataFieldToChoiceMap,
    } = this.props;
    const { search, columns } = this.state;

    let savedChoiceMap = {};
    if (
      dataFieldToChoiceMap[workingSheetName]
      && dataFieldToChoiceMap[workingSheetName][workingColumn]
    ) {
      savedChoiceMap = dataFieldToChoiceMap[workingSheetName][workingColumn];
    }

    const tableData = fieldErrors.unmatchedChoices.reduce((filtered, f) => {
      if (!Object.keys(savedChoiceMap).includes(f)) {
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

    let disabled = true;
    if (matchedChoiceMap[workingSheetName] && matchedChoiceMap[workingSheetName][workingColumn]) {
      if (Object.keys(matchedChoiceMap[workingSheetName][workingColumn]).length > 0) {
        disabled = false;
      }
    }

    return (
      <div className="ChoiceMatcher-table">
        <div className="ChoiceMatcher-tableTitle">
          <span className="ChoiceMatcher-searchBar">
            {'Search: '}
            <Input
              className="App-tableSearchBar"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
          </span>
          <button
            type="button"
            id="acceptChoiceMatches"
            disabled={disabled}
            onClick={() => {
              this.acceptMatches();
            }}
            className="App-submitButton ChoiceMatcher-matchAll"
          >
            Accept Matches
          </button>
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          pagination={{ defaultPageSize: 5, showSizeChanger: true, showQuickJumper: true }}
        />
      </div>
    );
  }
}

ChoiceMatcher.propTypes = {
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  ddData: PropTypes.arrayOf(PropTypes.object),
  matchedChoiceMap: PropTypes.objectOf(PropTypes.any),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
};

ChoiceMatcher.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  matchedChoiceMap: {},
  ddData: [],
  workingSheetName: '',
  workingColumn: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchChoices, highlightChoices }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChoiceMatcher);
