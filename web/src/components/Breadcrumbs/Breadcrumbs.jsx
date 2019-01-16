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

  onClick() {
    const {
      jsonData,
      redcapFieldToDataFieldMap,
      dataFileName,
      downloadProgress,
    } = this.props;
    const payload = {
      jsonData,
      redcapFieldToDataFieldMap,
      dataFileName,
    };
    downloadProgress(payload);
  }

  render() {
    const { page } = this.props;
    if (page === 'intro') {
      return <div className="Breadcrumbs-navigation">Intro</div>;
    }
    if (page === 'matchFields') {
      return (
        <div className="Breadcrumbs-navigation">
          Match Fields
          <a href="#" className="Breadcrumbs-download" onClick={this.onClick.bind(this)}>
            <div className="Breadcrumbs-downloadIcon">
              <DownloadIcon />
            </div>
            Download current progress
          </a>
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
};

Breadcrumbs.defaultProps = {
  page: 'intro',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ downloadProgress }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Breadcrumbs);
