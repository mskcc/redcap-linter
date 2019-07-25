import React, { Component } from 'react';
import './ErrorsResolved.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Icon, Spin } from 'antd';
import EncodedRecords from '../EncodedRecords/EncodedRecords';

import { importRecords, encodeRecords, downloadProgress } from '../../actions/REDCapLinterActions';

class ErrorsResolved extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      malformedSheets,
      decodedRecords,
      matchingRepeatInstances,
      matchingRecordIds,
      encodeRecords,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      malformedSheets,
      matchingRepeatInstances,
      matchingRecordIds,
      ddData,
      decodedRecords,
      csvHeaders,
    };
    encodeRecords(payload);
  }

  onClick(e) {
    const { downloadProgress } = this.props;
    downloadProgress();
  }

  uploadToRedcap() {
    const {
      encodedRecords, token, env, importRecords,
    } = this.props;

    const payload = {
      encodedRecords,
      token,
      env,
    };

    importRecords(payload);
  }

  render() {
    const {
      projectInfo,
      dataFileName,
      dataFieldToRedcapFieldMap,
      encodedRecords,
      encodedRecordHeaders,
      token,
      importErrors,
      loading,
    } = this.props;

    if (
      projectInfo.record_autonumbering_enabled === 1
      && projectInfo.repeatable_instruments
      && projectInfo.repeatable_instruments.length > 0
    ) {
      const options = [];

      Object.keys(dataFieldToRedcapFieldMap).forEach((sheet) => {
        Object.values(dataFieldToRedcapFieldMap[sheet]).forEach((redcapField) => {
          options.push({
            value: redcapField,
            label: redcapField,
          });
        });
      });
    }

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_output`;

    let uploadToRedcapButton = null;

    if (token) {
      uploadToRedcapButton = (
        <button
          type="submit"
          className="App-submitButton ErrorsResolved-download"
          onClick={this.uploadToRedcap.bind(this)}
          value="Submit"
        >
          <div className="ErrorsResolved-downloadIcon">
            <Icon type="upload" height="25px" />
          </div>
          Upload to REDCap
        </button>
      );
    }

    let errorText = null;

    let hasError = false;
    Object.keys(importErrors).forEach((sheet) => {
      if (importErrors[sheet].error) {
        hasError = true;
      }
    });

    if (hasError) {
      errorText = (
        <div className="ErrorsResolved-errorText">There were errors on upload to REDCap.</div>
      );
    }
    let content = '';
    if (loading) {
      content = <Spin tip="Loading..." />;
    } else {
      content = <EncodedRecords />;
    }

    return (
      <div>
        <div className="ErrorsResolved-introduction">
          <p>
            Please take the time now to ensure all column names are matched by navigating to the
            Match Fields screen.
          </p>
          <p>
            If all fields have been matched and all errors resolved you may now download your
            progress to prevent from having to resolve errors a second time.
          </p>
          <p>
            <b>WARNING</b>
:
          </p>
          <ul className="ErrorsResolved-warningList">
            <li className="ErrorsResolved-warningListItem">
              Remaining cells with errors will be removed entirely.
            </li>
            <li className="ErrorsResolved-warningListItem">
              Rows with a missing/invalidated required value will be ignored completely.
            </li>
            <li className="ErrorsResolved-warningListItem">
              Sheets without headers on the first row will be ignored. All columns with data must
              have a header.
            </li>
            <li className="ErrorsResolved-warningListItem">
              Date/Times from the original file may have been truncated to fit the upload format for
              REDCap.
            </li>
          </ul>
          <p>Please verify this is intended before continuing.</p>
          <p>
            Please fill out the form below to generate an output file containing the records encoded
            and ready to upload to REDCap.
          </p>
          <form
            id="downloadOutput"
            action={downloadLink}
            className="ErrorsResolved-hidden"
            method="POST"
          >
            <input
              key="encodedRecords"
              name="encodedRecords"
              type="hidden"
              value={JSON.stringify(encodedRecords)}
            />
            <input
              key="encodedRecordHeaders"
              name="encodedRecordHeaders"
              type="hidden"
              value={JSON.stringify(encodedRecordHeaders)}
            />
            <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName} />
          </form>
          <button
            type="submit"
            form="downloadOutput"
            onClick={e => this.onClick(e)}
            className="App-actionButton ErrorsResolved-download"
            value="Submit"
          >
            <div className="ErrorsResolved-downloadIcon">
              <Icon type="download" height="25px" />
            </div>
            Download Output
          </button>
          {uploadToRedcapButton}
          {errorText}
        </div>
        <div className="ErrorsResolved-container">{content}</div>
      </div>
    );
  }
}

ErrorsResolved.propTypes = {
  importErrors: PropTypes.objectOf(PropTypes.object),
  ddData: PropTypes.arrayOf(PropTypes.object),
  csvHeaders: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  decodedRecords: PropTypes.objectOf(PropTypes.array),
  matchingRepeatInstances: PropTypes.objectOf(PropTypes.object),
  matchingRecordIds: PropTypes.objectOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.array),
  encodedRecords: PropTypes.objectOf(PropTypes.array),
  encodedRecordHeaders: PropTypes.objectOf(PropTypes.array),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  dataFileName: PropTypes.string,
  loading: PropTypes.bool,
  token: PropTypes.string,
  env: PropTypes.string,
};

ErrorsResolved.defaultProps = {
  importErrors: {},
  ddData: [],
  csvHeaders: {},
  dataFieldToRedcapFieldMap: {},
  jsonData: {},
  encodedRecords: {},
  encodedRecordHeaders: {},
  decodedRecords: {},
  matchingRepeatInstances: {},
  matchingRecordIds: {},
  projectInfo: {},
  malformedSheets: [],
  dataFileName: '',
  loading: false,
  token: '',
  env: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ importRecords, encodeRecords, downloadProgress }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ErrorsResolved);
