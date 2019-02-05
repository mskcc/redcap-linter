import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Tab } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import Datatable from '../Datatable/Datatable';
import './EncodedRecords.scss';
import { postForm } from '../../actions/RedcapLinterActions';

class EncodedRecords extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const {
      encodedRecords,
    } = this.props;
    const sheets = Object.keys(encodedRecords);
    const panes = [];
    if (sheets && sheets.length > 0) {
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];

        const tData = encodedRecords[sheetName];
        let headers = [];
        if (tData.length > 0) {
          headers = Object.keys(tData[0]);
        }

        panes.push({
          menuItem: sheetName,
          render: () => (
            <Datatable
              sheetName={`${sheetName}`}
              headers={headers}
              tableData={tData}
            />
          ),
        });
      }
    } else {
      panes.push({
        menuItem: 'Sheet1',
        render: () => (
          <Datatable headers={[]} tableData={[]} />
        ),
      });
    }
    const tabProps = {
      className: 'EncodedRecords-tabs',
      menu: { secondary: true, pointing: true },
      panes: panes,
    };
    return <Tab {...tabProps} />;
  }
}

EncodedRecords.propTypes = {
  encodedRecords: PropTypes.object,
};

EncodedRecords.defaultProps = {
  encodedRecords: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EncodedRecords);
