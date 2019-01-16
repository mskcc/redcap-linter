import React, { Component } from 'react';
import './Breadcrumbs.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import DownloadIcon from '../DownloadIcon/DownloadIcon';
import { downloadProgress } from '../../actions/RedcapLinterActions';

class Breadcrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  // onClick() {
  //   const {
  //     jsonData,
  //     redcapFieldToDataFieldMap,
  //     dataFileName,
  //     downloadProgress,
  //   } = this.props;
  //   const payload = {
  //     jsonData,
  //     redcapFieldToDataFieldMap,
  //     dataFileName,
  //   };
  //   downloadProgress(payload);
  // }

  render() {
    const { page } = this.props;
    if (page === 'intro') {
      return <div className="Breadcrumbs-navigation">Intro</div>;
    }
    const {
      jsonData,
      redcapFieldToDataFieldMap,
      dataFileName,
    } = this.props;

    if (page === 'matchFields') {
      return (
        <div className="Breadcrumbs-navigation">
          Match Fields
          <form id="downloadForm" action="http://localhost:5000/download_progress" className="Breadcrumbs-hidden" method="POST">
            <input key="jsonData" name="jsonData" type="hidden" value={JSON.stringify(jsonData)} />
            <input key="redcapFieldToDataFieldMap" name="redcapFieldToDataFieldMap" type="hidden" value={JSON.stringify(redcapFieldToDataFieldMap)} />
            <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName} />
          </form>
          <button type="submit" form="downloadForm" className="Breadcrumbs-download" value="Submit">
            <div className="Breadcrumbs-downloadIcon">
              <DownloadIcon />
            </div>
            Download current progress
          </button>
        </div>
      );
    }
    return (
      <div className="Breadcrumbs-navigation">Lint</div>
    );
  }
}

Breadcrumbs.propTypes = {
  page: PropTypes.string,
  redcapFieldToDataFieldMap: PropTypes.object,
};

Breadcrumbs.defaultProps = {
  page: 'intro',
  redcapFieldToDataFieldMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ downloadProgress }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Breadcrumbs);
