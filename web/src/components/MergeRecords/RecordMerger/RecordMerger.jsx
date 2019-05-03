import React, { Component } from 'react';
import './RecordMerger.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { mergeField } from '../../../actions/RedcapLinterActions';

class RecordMerger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      noMatch: '',
      search: '',
      columns: [{
        title: 'Field',
        key: 'Field',
        render: (text, record) => (this.renderCell('Field', record)),
      },
      {
        title: 'Value in Datafile',
        key: 'Value in Datafile',
        render: (text, record) => (this.renderCell('Value in Datafile', record)),
      },
      {
        title: 'Existing Value in REDCap',
        key: 'Existing Value in REDCap',
        render: (text, record) => (this.renderCell('Existing Value in REDCap', record)),
      }],
    };
  }

  // ,
  // {
  //   title: 'Resolve',
  //   key: 'Resolve',
  //   render: (text, record) => (this.renderMatchButton(record)),
  // }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      workingMergeRow,
      workingSheetName,
    } = prevState;
    if (nextProps.workingMergeRow !== workingMergeRow || nextProps.workingSheetName !== workingSheetName) {
      return { mergeMap: {}, workingMergeRow: nextProps.workingMergeRow, workingSheetName: nextProps.workingSheetName };
    }
    return null;
  }

  handleMerge(header, cellInfo) {
    const {
      mergeField,
    } = this.props;
    const payload = {};
    payload[cellInfo['Field']] = cellInfo[header];
    mergeField(payload);
  }

  renderCell(header, cellInfo) {
    let className = 'RecordMerger-cell';
    let acceptButton = null;
    if (header !== 'Field') {
      acceptButton = (<div className="RecordMerger-accept">
        <a onClick={e => this.handleMerge(header, cellInfo, e)}>
          <Icon type="check" />
        </a>
      </div>);
    }
    return (
      <div className="RecordMerger-cellContainer">
        <div className={className}>
          { cellInfo[header] }
        </div>
        { acceptButton }
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
      dataFieldToRedcapFieldMap,
      mergeMap,
    } = this.props;
    const {
      search,
      columns,
    } = this.state;

    const row = jsonData[workingSheetName][workingMergeRow]
    const existingRecord = decodedRecords[row[recordidField]];

    let rowMergeMap = {};
    if (mergeMap[workingSheetName] && mergeMap[workingSheetName][workingMergeRow]) {
      rowMergeMap = mergeMap[workingSheetName][workingMergeRow];
    }

    // TODO if data field is missing from the data file, but existing in REDCap should it be left blank on upload?
    // REDCap provides options to override, need to talk to Julian to see if this is ever used
    const matchingHeaders = Object.values(dataFieldToRedcapFieldMap[workingSheetName]);
    const tableData = matchingHeaders.reduce((filtered, field) => {
      if (!rowMergeMap[field]) {
        if (String(row[field]) !== String(existingRecord[field]) && row[field] && existingRecord[field]) {
          filtered.push({
            'Field': field,
            'Value in Datafile': row[field] || '',
            'Existing Value in REDCap': existingRecord[field] || '',
          });
        }
      }
      return filtered;
    }, []);


    let data = tableData;
    if (search) {
      data = data.filter(row => row['Field'].includes(search));
    }

    return (
      <div className="RecordMerger-table">
        <div className="RecordMerger-tableTitle">
          <span className="RecordMerger-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </span>
        </div>
        <Table size="small" columns={columns} dataSource={data} pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }} />
      </div>
    );
  }
}

RecordMerger.propTypes = {
  mergeMap: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
};

RecordMerger.defaultProps = {
  mergeMap: {},
  dataFieldToChoiceMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ mergeField }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RecordMerger);
