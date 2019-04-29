import React, { Component } from 'react';
import './ErrorsResolved.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import EncodedRecords from '../EncodedRecords/EncodedRecords';
import DownloadIcon from '../DownloadIcon/DownloadIcon';

class ErrorsResolved extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValue: '',
    };
  }

  handleChange(e) {
    console.log(e)
  }

  render() {
    const {
      jsonData,
      projectInfo,
      dataFileName,
      dataFieldToRedcapFieldMap,
      ddData,
      csvHeaders,
      malformedSheets,
    } = this.props;

    const {
      selectedValue,
    } = this.state;

    // TODO For Autonumbering projects with Repeatable Instruments create a dropdown to choose a field for each sheet to repeat on
    let repeatableFieldDropdown = null;
    if (projectInfo.record_autonumbering_enabled === 1 && projectInfo.repeatable_instruments && projectInfo.repeatable_instruments.length > 0) {
      const options = [];

      Object.keys(dataFieldToRedcapFieldMap).forEach((sheet) => {
        Object.values(dataFieldToRedcapFieldMap[sheet]).forEach((redcapField) => {
          options.push({
            value: redcapField,
            label: redcapField,
          })
        });
      });
      repeatableFieldDropdown = (<div className="ErrorsResolved-repeatField">
        <b>Select a column to repeat on</b>:
        <Select
          options={options}
          isSearchable
          value={selectedValue}
          onChange={e => this.handleChange(e)}
          placeholder="Select..."
        />
      </div>);
    }

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_output`;

    return (
      <div>
        <div className="ErrorsResolved-introduction">
          <p>Please take the time now to ensure all column names are matched by navigating to the Match Fields screen.</p>
          <p>If all fields have been matched and all errors resolved you may now download your progress to prevent from having to resolve errors a second time.</p>
          <p><b>WARNING</b>:</p>
          <ul className="ErrorsResolved-warningList">
            <li className="ErrorsResolved-warningListItem">Remaining cells with errors will be removed entirely.</li>
            <li className="ErrorsResolved-warningListItem">Rows with a missing/invalidated required value will be ignored completely.</li>
            <li className="ErrorsResolved-warningListItem">Sheets without headers on the first row will be ignored. All columns with data must have a header.</li>
            <li className="ErrorsResolved-warningListItem">Date/Times from the original file may have been truncated to fit the upload format for REDCap.</li>
          </ul>
          <p>Please verify this is intended before continuing.</p>
          <p>Please fill out the form below to generate an output file containing the records encoded and ready to upload to REDCap.</p>
          <form id="downloadOutput" action={downloadLink} className="ErrorsResolved-hidden" method="POST">
            <input key="jsonData" name="jsonData" type="hidden" value={JSON.stringify(jsonData)} />
            <input key="ddData" name="ddData" type="hidden" value={JSON.stringify(ddData)} />
            <input key="csvHeaders" name="csvHeaders" type="hidden" value={JSON.stringify(csvHeaders)} />
            <input key="projectInfo" name="projectInfo" type="hidden" value={JSON.stringify(projectInfo)} />
            <input key="malformedSheets" name="malformedSheets" type="hidden" value={JSON.stringify(malformedSheets)} />
            <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName} />
          </form>
          { repeatableFieldDropdown }
          <button type="submit" form="downloadOutput" className="App-actionButton ErrorsResolved-download" value="Submit">
            <div className="ErrorsResolved-downloadIcon">
              <DownloadIcon />
            </div>
            Download Output
          </button>
        </div>
        <div className="ErrorsResolved-container">
          <EncodedRecords />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorsResolved);
