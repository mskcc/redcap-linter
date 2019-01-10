import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Tab,
  Tabs,
  TabList,
  TabPanel,
} from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PropTypes from 'prop-types';
import Datatable from '../Datatable/Datatable';
import './TabbedDatatable.css';
import { postForm } from '../../actions/RedcapLinterActions';

class TabbedDatatable extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const {
      csvHeaders,
      jsonData,
      ddHeaders,
      ddData,
      cellsWithErrors,
      recordFieldsNotInRedcap,
      allErrors,
    } = this.props;
    const sheets = Object.keys(csvHeaders);
    const tabs = [];
    const tabPanels = [];
    let tableData = [];
    let tableErrors = [];
    let tableFieldsNotInRedcap = [];
    let headers = [];
    if (sheets && sheets.length > 0) {
      sheets.forEach((sheetName) => {
        headers = csvHeaders[sheetName];
        if (jsonData && jsonData[sheetName]) {
          // TODO Find a better way to do this!!!
          tableData = jsonData[sheetName];
        }
        if (cellsWithErrors && cellsWithErrors[sheetName]) {
          tableErrors = cellsWithErrors[sheetName];
        }
        if (recordFieldsNotInRedcap && recordFieldsNotInRedcap[sheetName]) {
          tableFieldsNotInRedcap = recordFieldsNotInRedcap[sheetName];
        }

        tabs.push(<Tab key={`${sheetName}`}>{sheetName}</Tab>);
        tabPanels.push(
          <TabPanel key={`${sheetName}`}>
            <Datatable
              sheetName={`${sheetName}`}
              headers={headers}
              tableData={tableData}
              tableErrors={tableErrors}
              tableFieldsNotInRedcap={tableFieldsNotInRedcap}
            />
          </TabPanel>,
        );
      });
      tabs.push(<Tab key="Data-Dictionary">Data-Dictionary</Tab>);
      tabPanels.push(
        <TabPanel key="Data-Dictionary">
          <Datatable
            sheetName="Data-Dictionary"
            headers={ddHeaders}
            tableData={ddData}
          />
        </TabPanel>,
      );
      if (allErrors.length > 0) {
        tabs.push(<Tab key="All-Errors">Errors</Tab>);
        tabPanels.push(
          <TabPanel key="All-Errors">
            <Datatable
              sheetName="All-Errors"
              headers={['error']}
              tableData={allErrors}
            />
          </TabPanel>,
        );
      }
    } else {
      tabs.push(<Tab key="sheet1">Sheet1</Tab>);
      tabPanels.push(
        <TabPanel key="sheet1">
          <Datatable headers={headers} tableData={tableData} />
        </TabPanel>,
      );
    }
    return (
      <Tabs className="TabbedDatatable_tabs">
        <TabList className="TabbedDatatable_tabList">
          {tabs}
        </TabList>

        {tabPanels}
      </Tabs>
    );
  }
}

TabbedDatatable.propTypes = {
  csvHeaders: PropTypes.object.isRequired,
  jsonData: PropTypes.object,
  ddHeaders: PropTypes.array,
  ddData: PropTypes.array,
  cellsWithErrors: PropTypes.object,
  recordFieldsNotInRedcap: PropTypes.object,
  allErrors: PropTypes.array
};

TabbedDatatable.defaultProps = {
  jsonData: {},
  ddHeaders: [],
  ddData: [],
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
  allErrors: []
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TabbedDatatable);
