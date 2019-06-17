import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import Datatable from '../Datatable/Datatable';
import './TabbedDatatable.scss';
import { postForm } from '../../actions/REDCapLinterActions';

const { TabPane } = Tabs;

class TabbedDatatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeIndex: '0',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevSheetName = prevState.workingSheetName;
    const prevColumn = prevState.workingColumn;
    const { csvHeaders, workingSheetName, workingColumn } = nextProps;
    const sheets = Object.keys(csvHeaders);
    if (!prevSheetName || (prevSheetName !== workingSheetName || prevColumn !== workingColumn)) {
      if (workingSheetName && workingColumn) {
        return {
          activeIndex: sheets.indexOf(workingSheetName).toString(),
          workingSheetName,
          workingColumn,
        };
      }
      return null;
    }
    return { activeIndex: prevState.activeIndex };
  }

  handleTabChange(key) {
    this.setState({ activeIndex: key });
  }

  render() {
    const {
      csvHeaders,
      jsonData,
      ddHeaders,
      ddDataRaw,
      cellsWithErrors,
      recordFieldsNotInRedcap,
      dataFieldToRedcapFieldMap,
      matchedFieldMap,
      fieldsSaved,
      allErrors,
      workingSheetName,
      workingColumn,
      filter,
    } = this.props;
    const sheets = Object.keys(csvHeaders);
    const panes = [];
    const { activeIndex } = this.state;
    const workingIndex = sheets.indexOf(workingSheetName);

    const { filterSheet, filterRowNum } = this.props;

    if (sheets && sheets.length > 0) {
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];
        let tableFilter = '';
        let filterColumn = '';
        if (i === workingIndex && filter) {
          tableFilter = filter;
          filterColumn = workingColumn;
        }

        let selectedRowNum = '';
        if (sheetName === filterSheet) {
          selectedRowNum = filterRowNum;
        }

        let tData = [];
        const tHeaders = csvHeaders[sheetName];
        if (jsonData && jsonData[sheetName]) {
          // TODO Find a better way to do this!!!
          tData = jsonData[sheetName];
        }
        let tableErrors = [];
        if (cellsWithErrors && cellsWithErrors[sheetName]) {
          tableErrors = cellsWithErrors[sheetName];
        }
        if (selectedRowNum) {
          tableErrors = [tableErrors[selectedRowNum]];
        }
        let tableFieldsNotInRedcap = [];
        if (recordFieldsNotInRedcap && recordFieldsNotInRedcap[sheetName]) {
          tableFieldsNotInRedcap = recordFieldsNotInRedcap[sheetName];
        }

        panes.push(
          <TabPane tab={sheetName} key={panes.length.toString()}>
            <Datatable
              sheetName={`${sheetName}`}
              headers={tHeaders}
              tableData={tData}
              tableFilter={tableFilter}
              dataFieldToRedcapFieldMap={dataFieldToRedcapFieldMap}
              matchedFieldMap={matchedFieldMap}
              fieldsSaved={fieldsSaved}
              selectedRowNum={selectedRowNum}
              filterColumn={filterColumn}
              tableErrors={tableErrors}
              tableFieldsNotInRedcap={tableFieldsNotInRedcap}
            />
          </TabPane>,
        );
      }
      panes.push(
        <TabPane tab="Data-Dictionary" key={panes.length.toString()}>
          <Datatable
            sheetName="Data-Dictionary"
            headers={ddHeaders}
            tableData={ddDataRaw}
            editable={false}
          />
        </TabPane>,
      );
      if (allErrors.length > 0) {
        panes.push(
          <TabPane tab={`Errors (${allErrors.length})`} key={panes.length.toString()}>
            <Datatable
              sheetName="All-Errors"
              headers={['Error']}
              tableData={allErrors}
              sheetInError
              editable={false}
            />
          </TabPane>,
        );
      }
    } else {
      panes.push(
        <TabPane tab="Sheet1" key={panes.length.toString()}>
          <Datatable headers={[]} tableData={[]} />
        </TabPane>,
      );
    }
    const tabProps = {
      className: 'TabbedDatatable-tabs',
      animated: false,
      activeKey: activeIndex,
      onChange: this.handleTabChange.bind(this),
    };
    return (
      <div className="TabbedDatatable-main">
        <Tabs {...tabProps}>{panes}</Tabs>
      </div>
    );
  }
}

TabbedDatatable.propTypes = {
  csvHeaders: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  jsonData: PropTypes.objectOf(PropTypes.array),
  ddHeaders: PropTypes.arrayOf(PropTypes.string),
  ddDataRaw: PropTypes.arrayOf(PropTypes.object),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  recordFieldsNotInRedcap: PropTypes.objectOf(PropTypes.array),
  allErrors: PropTypes.arrayOf(PropTypes.object),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  matchedFieldMap: PropTypes.objectOf(PropTypes.object),
  fieldsSaved: PropTypes.bool,
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
  filter: PropTypes.string,
};

TabbedDatatable.defaultProps = {
  csvHeaders: {},
  jsonData: {},
  ddHeaders: [],
  ddDataRaw: [],
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
  allErrors: [],
  dataFieldToRedcapFieldMap: {},
  matchedFieldMap: {},
  fieldsSaved: false,
  workingSheetName: '',
  workingColumn: '',
  filter: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TabbedDatatable);
