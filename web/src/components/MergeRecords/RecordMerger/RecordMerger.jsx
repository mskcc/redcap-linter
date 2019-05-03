import React, { Component } from 'react';
import './RecordMerger.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { matchChoices } from '../../../actions/RedcapLinterActions';

class RecordMerger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      choiceMap: {},
      noMatch: '',
      search: '',
      columns: [{
        title: 'Field',
        key: 'Field',
        render: (text, record) => (this.renderCell('Field', record)),
      },
      {
        title: 'Value',
        key: 'Value',
        render: (text, record) => (this.renderCell('Value', record)),
      }],
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      workingMergeRow,
      workingSheetName,
    } = prevState;
    if (nextProps.workingMergeRow !== workingMergeRow || nextProps.workingSheetName !== workingSheetName) {
      return { choiceMap: {}, workingMergeRow: nextProps.workingMergeRow, workingSheetName: nextProps.workingSheetName };
    }
    return null;
  }

  acceptMatches(e) {
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

  renderMatchButton(cellInfo) {
    const fieldToMatch = cellInfo['Field'];
    const {
      choiceMap,
    } = this.state;
    let disabled = true;
    if (choiceMap[fieldToMatch]) {
      disabled = false;
    }
    return (
      <div className="RecordMerger-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleMatch(fieldToMatch, e)} className="App-submitButton">Match</button>
        <button type="button" onClick={e => this.handleNoMatch(fieldToMatch, e)} className="App-actionButton">No Match</button>
      </div>
    );
  }

  render() {
    const {
      decodedRecords,
      workingSheetName,
      workingMergeRow,
      recordidField,
      jsonData,
      csvHeaders,
    } = this.props;
    const {
      search,
      columns,
      choiceMap,
    } = this.state;

    const row = jsonData[workingSheetName][workingMergeRow]
    const existingRecord = decodedRecords[row[recordidField]];

    const sheetHeaders = csvHeaders[workingSheetName];
    const tableData = Object.keys(existingRecord).reduce((filtered, field) => {
      filtered.push({
        'Field': field,
        'Value': existingRecord[field] || "",
      });
      return filtered;
    }, []);


    let data = tableData;
    if (search) {
      data = data.filter(row => row['Field'].includes(search));
    }

    const disabled = Object.keys(choiceMap).length === 0;

    return (
      <div className="RecordMerger-table">
        <div className="RecordMerger-tableTitle">
          <span className="RecordMerger-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
          <button type="button" disabled={disabled} onClick={this.acceptMatches.bind(this)} className="App-submitButton RecordMerger-matchAll">Accept Matches</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }} />
      </div>
    );
  }
}

RecordMerger.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
};

RecordMerger.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ matchChoices }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RecordMerger);
