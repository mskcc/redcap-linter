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
    const { csvHeaders } = this.props;
    const sheets = Object.keys(csvHeaders);
    const tabs = [];
    const tabPanels = [];
    if (sheets && sheets.length > 0) {
      sheets.forEach((sheetName) => {
        tabs.push(<Tab key={`${sheetName}`}>{sheetName}</Tab>);
        tabPanels.push(
          <TabPanel key={`${sheetName}`}>
            <Datatable sheetName={`${sheetName}`} />
          </TabPanel>,
        );
      });
    } else {
      tabs.push(<Tab key="sheet1">Sheet1</Tab>);
      tabPanels.push(
        <TabPanel key="sheet1">
          <Datatable />
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
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TabbedDatatable);
