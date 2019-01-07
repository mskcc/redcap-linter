import React, { Component } from 'react';
import { connect } from 'react-redux';
import Datatable from '../Datatable/Datatable';
import './TabbedDatatable.css'
import { bindActionCreators } from 'redux';
import { postForm } from '../../actions/RedcapLinterActions';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";


class TabbedDatatable extends Component {

  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);
  }

  getStateFromProps(props) {
    return {
      selected: '',
      data: []
    };
  }

  render() {
    return (
    	<Tabs className="TabbedDatatable_tabs">
        <TabList className="TabbedDatatable_tabList">
          <Tab>Title 1</Tab>
          <Tab>Title 2</Tab>
        </TabList>

        <TabPanel>
          <Datatable />
        </TabPanel>
        <TabPanel>
          <Datatable />
        </TabPanel>
      </Tabs>
    	);
	}
}

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm: postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TabbedDatatable);