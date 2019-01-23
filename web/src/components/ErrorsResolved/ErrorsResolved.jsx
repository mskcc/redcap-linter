import React, { Component } from 'react';
import './ErrorsResolved.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DownloadIcon from '../DownloadIcon/DownloadIcon';

class ErrorsResolved extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const {
      jsonData,
      projectInfo,
      dataFileName,
      ddData,
      csvHeaders,
    } = this.props;

    return (
      <div className="ErrorsResolved-introduction">
        <p>All errors are resolved!</p>
        <p>Please take the time now to ensure all column names are matched by navigating to the Match Fields screen.</p>
        <p>If all fields have been matched and all errors resolved you may now download your progress to prevent from having to resolve errors a second time.</p>
        <p>Date/Times from the original file may have been truncated to fit the upload format for REDCap.</p>
        <p>Please fill out the form below to generate an output file containing the records encoded and ready to upload to REDCap.</p>
        <form id="downloadOutput" action="http://localhost:5000/download_output" className="ErrorsResolved-hidden" method="POST">
          <input key="jsonData" name="jsonData" type="hidden" value={JSON.stringify(jsonData)} />
          <input key="ddData" name="ddData" type="hidden" value={JSON.stringify(ddData)} />
          <input key="csvHeaders" name="csvHeaders" type="hidden" value={JSON.stringify(csvHeaders)} />
          <input key="projectInfo" name="projectInfo" type="hidden" value={JSON.stringify(projectInfo)} />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName} />
        </form>
        <button type="submit" form="downloadOutput" className="ErrorsResolved-download" value="Submit">
          <div className="ErrorsResolved-downloadIcon">
            <DownloadIcon />
          </div>
          Download Output
        </button>
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
