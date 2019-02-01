import React, { Component } from 'react';
import './ChoiceMatcher.scss';
import '../../../App.scss';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { matchChoices, resolveColumn, resolveRow } from '../../../actions/RedcapLinterActions';

class ChoiceMatcher extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataFieldToChoiceMap: {},
      noMatch: '',
      search: '',
    };
  }

  changeResolve(e) {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      recordsMissingRequiredData,
      columnsInError,
      resolveRow,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      columnsInError,
      nextColumn: e.value.column,
      nextRow: e.value.rowNum,
      nextSheetName: e.value.sheet,
      recordsMissingRequiredData,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    if (e.value.rowNum) {
      resolveRow(payload);
    } else {
      resolveColumn(payload);
    }
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
      fieldErrors,
    } = this.props;
    const {
      dataFieldToChoiceMap,
    } = this.state;
    if (fieldErrors && fieldErrors.fieldType === 'checkbox') {
      dataFieldToChoiceMap[fieldToMatch] = e.map(choice => choice.value);
    } else {
      dataFieldToChoiceMap[fieldToMatch] = e.value;
    }
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
      ddData,
      workingColumn,
    } = this.props;
    const choiceCandidates = fieldErrors.choiceCandidates || {};
    const {
      dataFieldToChoiceMap,
    } = this.state;
    const ddField = ddData.find(field => field.field_name === workingColumn);
    const dataField = cellInfo.original['Data Field'];
    const value = dataFieldToChoiceMap[dataField];
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
      const checkboxItems = dataField.split(',').map(item => item.trim());
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
    const fieldToMatch = cellInfo.value;
    let scores = choiceCandidates[fieldToMatch];
    scores = scores.sort((a, b) => b.score - a.score);
    const options = scores.map(score => ({
      value: score.candidate,
      label: <span><b>{score.candidate}</b> | <span style={{ fontWeight: 'lighter' }}>{score.choiceValue}</span></span>,
    }));

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
      recordsMissingRequiredData,
      workingSheetName,
      workingColumn,
      columnsInError,
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

    const options = [];
    let allErrors = [];
    Object.keys(columnsInError).forEach((sheet) => {
      const subOptions = [];
      columnsInError[sheet].forEach((columnInError) => {
        subOptions.push({
          value: { sheet: sheet, column: columnInError },
          label: columnInError,
        });
      });
      options.push({
        label: `${sheet} | Column Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(columnsInError[sheet]);
    });

    Object.keys(recordsMissingRequiredData).forEach((sheet) => {
      const subOptions = [];
      recordsMissingRequiredData[sheet].forEach((rowNumber) => {
        subOptions.push({
          value: { sheet: sheet, rowNum: rowNumber },
          label: rowNumber+1,
        });
      });
      options.push({
        label: `${sheet} | Row Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(recordsMissingRequiredData[sheet]);
    });

    const selectedValue = {
      value: { sheet: workingSheetName, column: workingColumn },
      label: workingColumn,
    };

    const longestOption = allErrors.sort((a, b) => b.length - a.length)[0];
    const selectWidth = 8 * longestOption + 60;

    const selectStyles = {
      control: provided => ({
        ...provided,
        minWidth: `${selectWidth}px`,
      }),
      menu: provided => ({
        // none of react-select's styles are passed to <Control />
        ...provided,
        minWidth: `${selectWidth}px`,
      }),
    };

    const fieldInErrorSelector = (
      <Select
        options={options}
        isSearchable
        value={selectedValue}
        styles={selectStyles}
        onChange={this.changeResolve.bind(this)}
      />
    );

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Data Field'].includes(search));
    }

    // {`${workingSheetName}: ${workingColumn}`}

    return (
      <div className="ChoiceMatcher-table">
        <div className="ChoiceMatcher-tableTitle">
          <span className="ChoiceMatcher-searchBar">
            Search: <input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
          <span className="ChoiceMatcher-tableLabel">{ fieldInErrorSelector }</span>
        </div>
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
  return bindActionCreators({ matchChoices, resolveColumn, resolveRow }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChoiceMatcher);
