import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Tabs } from 'antd';
import { Tab } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import Datatable from '../Datatable/Datatable';
import './EncodedRecords.scss';
import { postForm } from '../../actions/RedcapLinterActions';

const { TabPane } = Tabs;

class EncodedRecords extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const {
      encodedRecords,
      encodedRecordsHeaders,
    } = this.props;
    const sheets = Object.keys(encodedRecords);
    const panes = [];
    if (sheets && sheets.length > 0) {
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];

        const tData = encodedRecords[sheetName];
        const headers = encodedRecordsHeaders[sheetName];

        panes.push(
          <TabPane tab={sheetName} key={panes.length.toString()}>
            <Datatable
              sheetName={`${sheetName}`}
              headers={headers}
              tableData={tData}
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
      className: 'EncodedRecords-tabs',
      animated: false,
    };
    return <Tabs {...tabProps}>{ panes }</Tabs>;
  }
}

EncodedRecords.propTypes = {
  encodedRecords: PropTypes.object,
  encodedRecordsHeaders: PropTypes.object,
};

EncodedRecords.defaultProps = {
  encodedRecords: {},
  encodedRecordsHeaders: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EncodedRecords);
