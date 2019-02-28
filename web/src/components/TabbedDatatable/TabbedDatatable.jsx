import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import Datatable from '../Datatable/Datatable';
import './TabbedDatatable.scss';
import { postForm } from '../../actions/RedcapLinterActions';

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
    const {
      csvHeaders,
      workingSheetName,
      workingColumn,
    } = nextProps;
    const sheets = Object.keys(csvHeaders);
    if (!prevSheetName || (prevSheetName !== workingSheetName || prevColumn !== workingColumn)) {
      return { activeIndex: sheets.indexOf(workingSheetName).toString(), workingSheetName, workingColumn };
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
      ddData,
      ddDataRaw,
      cellsWithErrors,
      recordFieldsNotInRedcap,
      allErrors,
      sheetsNotInRedcap,
      workingSheetName,
      workingColumn,
      filter,
    } = this.props;
    const sheets = Object.keys(csvHeaders);
    const panes = [];
    const {
      activeIndex,
    } = this.state;
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
              selectedRowNum={selectedRowNum}
              filterColumn={filterColumn}
              tableErrors={tableErrors}
              tableFieldsNotInRedcap={tableFieldsNotInRedcap}
            />
          </TabPane>
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
        </TabPane>
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
          </TabPane>
        );
      }
    } else {
      panes.push(
        <TabPane tab="Sheet1" key={panes.length.toString()}>
          <Datatable headers={[]} tableData={[]} />
        </TabPane>
      );
    }
    const tabProps = {
      className: "TabbedDatatable-tabs",
      animated: false,
      activeKey: activeIndex,
      onChange: this.handleTabChange.bind(this)
    };
    return <Tabs {...tabProps}>{ panes }</Tabs>;
  }
}

TabbedDatatable.propTypes = {
  csvHeaders: PropTypes.object.isRequired,
  jsonData: PropTypes.object,
  ddHeaders: PropTypes.array,
  ddData: PropTypes.array,
  cellsWithErrors: PropTypes.object,
  recordFieldsNotInRedcap: PropTypes.object,
  allErrors: PropTypes.array,
  sheetsNotInRedcap: PropTypes.array,
};

TabbedDatatable.defaultProps = {
  jsonData: {},
  ddHeaders: [],
  ddData: [],
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
  allErrors: [],
  sheetsNotInRedcap: [],
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TabbedDatatable);
