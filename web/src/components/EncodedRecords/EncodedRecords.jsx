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
      formNameToDdFields,
      ddData,
    } = this.props;

    const tabProps = {
      className: 'EncodedRecords-tabs',
      animated: false,
    };

    const sheets = Object.keys(encodedRecords);
    const panes = [];
    if (sheets && sheets.length > 0) {
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];

        const innerPanes = [];

        const recordidField = ddData[0].field_name;

        Object.keys(encodedRecords[sheetName]).forEach((formName) => {
          const tData = encodedRecords[sheetName][formName];
          const formFields = formNameToDdFields[formName];
          const headers = [];
          if (tData && tData.length > 0) {
            const encodedHeaders = Object.keys(tData[0]);
            formFields.forEach((field) => {
              if (encodedHeaders.includes(field) && field !== recordidField) {
                headers.push(field);
              }
            });

            // Change this later to account for repeatable instruments, this prepends with recordid field
            encodedHeaders.forEach((header) => {
              if (!formFields.includes(header) && header !== recordidField) {
                headers.unshift(header);
              }
            });

            headers.unshift(recordidField);
          }
          innerPanes.push(
            <TabPane tab={formName} key={innerPanes.length.toString()}>
              <Datatable
                sheetName={`${formName}`}
                headers={headers}
                tableData={tData}
              />
            </TabPane>
          );
        });

        panes.push(
          <TabPane tab={sheetName} key={panes.length.toString()}>
            <Tabs {...tabProps}>{ innerPanes }</Tabs>
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

    return <Tabs {...tabProps}>{ panes }</Tabs>;
  }
}

EncodedRecords.propTypes = {
  encodedRecords: PropTypes.object,
  encodedRecordsHeaders: PropTypes.object,
  formNameToDdFields: PropTypes.object,
  ddData: PropTypes.array,
};

EncodedRecords.defaultProps = {
  encodedRecords: {},
  encodedRecordsHeaders: {},
  formNameToDdFields: {},
  ddData: [],
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EncodedRecords);
