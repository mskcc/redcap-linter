import React, { Component } from 'react';
import './RecordMerger.scss';
import '../../../App.scss';
import { Table, Input, Icon } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { mergeField } from '../../../actions/REDCapLinterActions';

class RecordMerger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Field',
          key: 'Field',
          render: (text, record) => this.renderCell('Field', record),
        },
        {
          title: 'Value in Datafile',
          key: 'Value in Datafile',
          render: (text, record) => this.renderCell('Value in Datafile', record),
        },
        {
          title: 'Existing Value in REDCap',
          key: 'Existing Value in REDCap',
          render: (text, record) => this.renderCell('Existing Value in REDCap', record),
        },
      ],
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { workingMergeRow, workingSheetName } = prevState;
    if (
      nextProps.workingMergeRow !== workingMergeRow
      || nextProps.workingSheetName !== workingSheetName
    ) {
      return {
        mergeMap: {},
        workingMergeRow: nextProps.workingMergeRow,
        workingSheetName: nextProps.workingSheetName,
      };
    }
    return null;
  }

  handleMerge(header, cellInfo) {
    const { mergeField } = this.props;
    const payload = {};
    payload[cellInfo.Field] = cellInfo[header];
    mergeField(payload);
  }

  renderCell(header, cellInfo) {
    const className = 'RecordMerger-cell';
    let acceptButton = null;
    if (
      header !== 'Field'
      && String(cellInfo['Value in Datafile']) !== String(cellInfo['Existing Value in REDCap'])
    ) {
      acceptButton = (
        <div className="RecordMerger-accept">
          <a onClick={e => this.handleMerge(header, cellInfo, e)}>
            <Icon type="check" />
          </a>
        </div>
      );
    }
    return (
      <div className="RecordMerger-cellContainer">
        <div className={className}>{cellInfo[header]}</div>
        {acceptButton}
      </div>
    );
  }

  render() {
    const {
      workingSheetName,
      workingMergeRow,
      mergeConflicts,
      recordidField,
      projectInfo,
      reconciliationColumns,
      matchingRepeatInstances,
      jsonData,
      dataFieldToRedcapFieldMap,
      mergeMap,
    } = this.props;
    const { search, columns } = this.state;

    const row = jsonData[workingSheetName][workingMergeRow];
    const existingRecord = mergeConflicts[workingSheetName][workingMergeRow];

    let rowMergeMap = {};
    if (mergeMap[workingSheetName] && mergeMap[workingSheetName][workingMergeRow]) {
      rowMergeMap = mergeMap[workingSheetName][workingMergeRow];
    }

    let matchingRepeatInstruments = [];
    if (
      matchingRepeatInstances[workingSheetName]
      && matchingRepeatInstances[workingSheetName][workingMergeRow]
    ) {
      matchingRepeatInstruments = Object.keys(
        matchingRepeatInstances[workingSheetName][workingMergeRow],
      );
    }

    let reconciliationFields = [];
    Object.keys(reconciliationColumns).forEach((repeatInstrument) => {
      if (matchingRepeatInstruments.includes(repeatInstrument)) {
        reconciliationFields = reconciliationFields.concat(reconciliationColumns[repeatInstrument]);
      }
    });
    if (projectInfo.secondary_unique_field && projectInfo.secondary_unique_field.length > 0) {
      projectInfo.secondary_unique_field.forEach((field) => {
        reconciliationFields.push(field);
      });
    }
    reconciliationFields.push(recordidField);

    // console.log(existingRecord);

    // TODO if data field is missing from the data file, but existing in REDCap should it be left blank on upload?
    // REDCap provides options to override, need to talk to Julian to see if this is ever used
    const matchingHeaders = Object.values(dataFieldToRedcapFieldMap[workingSheetName]);
    const tableData = matchingHeaders.reduce((filtered, field) => {
      if (!rowMergeMap[field]) {
        if (String(row[field]) !== String(existingRecord[field]) && existingRecord[field]) {
          filtered.push({
            Field: field,
            'Value in Datafile': row[field] || '',
            'Existing Value in REDCap': existingRecord[field] || '',
          });
        }
      }
      return filtered;
    }, []);

    reconciliationFields.forEach((field) => {
      tableData.unshift({
        Field: field,
        'Value in Datafile': row[field] || '',
        'Existing Value in REDCap': existingRecord[field] || '',
      });
    });

    let data = tableData;
    if (search) {
      data = data.filter(r => r.Field.includes(search));
    }

    return (
      <div className="RecordMerger-table">
        <div className="RecordMerger-tableTitle">
          <span className="RecordMerger-searchBar">
            {'Search: '}
            <Input
              className="App-tableSearchBar"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
          </span>
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

RecordMerger.propTypes = {
  mergeMap: PropTypes.objectOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.array),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  mergeConflicts: PropTypes.objectOf(PropTypes.object),
  reconciliationColumns: PropTypes.objectOf(PropTypes.array),
  matchingRepeatInstances: PropTypes.objectOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  recordidField: PropTypes.string,
  workingSheetName: PropTypes.string,
  workingMergeRow: PropTypes.number,
};

RecordMerger.defaultProps = {
  mergeMap: {},
  jsonData: {},
  dataFieldToRedcapFieldMap: {},
  mergeConflicts: {},
  projectInfo: {},
  reconciliationColumns: {},
  matchingRepeatInstances: {},
  recordidField: '',
  workingSheetName: '',
  workingMergeRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ mergeField }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RecordMerger);
