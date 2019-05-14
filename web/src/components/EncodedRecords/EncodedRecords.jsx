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
      projectInfo,
      recordidField,
      importErrors,
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

        const tData = encodedRecords[sheetName];

        const ddFields = [];
        ddData.forEach((ddField) => {
          if (!ddFields.includes(ddField.field_name)) {
            ddFields.push(ddField.field_name);
          }
        });

        const headers = [];
        if (tData && tData.length > 0) {
          const encodedHeaders = Object.keys(tData[0]);
          ddFields.forEach((field) => {
            if (encodedHeaders.includes(field) && field !== recordidField) {
              headers.push(field);
            }
          });

          // Change this later to account for repeatable instruments, this prepends with recordid field
          encodedHeaders.forEach((header) => {
            if (!ddFields.includes(header) && header !== recordidField) {
              headers.unshift(header);
            }
          });

          headers.unshift(recordidField);
        }

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

      const importErrs = [];

      let hasError = false;
      Object.keys(importErrors).forEach((sheet) => {
        if (importErrors[sheet]['error']) {
          hasError = true;
        }
      });

      if (hasError) {
        Object.keys(importErrors).forEach((sheet) => {
          if (importErrors[sheet]['error']) {
            importErrors[sheet]['error'].split('\n').forEach((err) => {
              importErrs.push({ sheet: sheet, error: err });
            });
          }
        });


        panes.push(
          <TabPane tab={<span className="EncodedRecords-errorTab">Import Errors</span>} key={panes.length.toString()}>
            <Datatable
              sheetName={'Import Errors'}
              sheetInError
              headers={['sheet', 'error']}
              tableData={importErrs}
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

    return <Tabs {...tabProps}>{ panes }</Tabs>;
  }
}

EncodedRecords.propTypes = {
  encodedRecords: PropTypes.object,
  encodedRecordsHeaders: PropTypes.object,
  formNameToDdFields: PropTypes.object,
  projectInfo: PropTypes.object,
  ddData: PropTypes.array,
  recordidField: PropTypes.string,
  importErrors: PropTypes.object,
};

EncodedRecords.defaultProps = {
  encodedRecords: {},
  encodedRecordsHeaders: {},
  formNameToDdFields: {},
  projectInfo: {},
  ddData: [],
  recordidField: '',
  importErrors: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EncodedRecords);
