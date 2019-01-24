import React, { Component } from 'react';
import './Breadcrumbs.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import DownloadIcon from '../DownloadIcon/DownloadIcon';
import { navigateTo } from '../../actions/RedcapLinterActions';

class Breadcrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 'intro',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const pages = ['intro', 'matchFields', 'lint'];
    if (nextProps.new) {
      return { currentPage: 'matchFields' };
    }
    if (nextProps.loading) {
      return { currentPage: 'intro' };
    }
    const { page } = nextProps;
    const { currentPage } = prevState;
    if (pages.indexOf(page) > pages.indexOf(currentPage)) {
      return { currentPage: page };
    }
    return null;
  }

  goTo(page) {
    const {
      navigateTo,
    } = this.props;
    navigateTo(page);
  }

  render() {
    const { page } = this.props;
    const { currentPage } = this.state;
    const pages = ['intro', 'matchFields', 'lint']

    const {
      jsonData,
      redcapFieldToDataFieldMap,
      csvHeaders,
      dataFileName,
    } = this.props;

    const downloadButton = (
      <div key="downloadProgressButton" className="Breadcrumbs-downloadButton">
        <form id="downloadForm" action="http://localhost:5000/download_progress" className="Breadcrumbs-hidden" method="POST">
          <input key="jsonData" name="jsonData" type="hidden" value={JSON.stringify(jsonData || {})} />
          <input key="redcapFieldToDataFieldMap" name="redcapFieldToDataFieldMap" type="hidden" value={JSON.stringify(redcapFieldToDataFieldMap)} />
          <input key="csvHeaders" name="csvHeaders" type="hidden" value={JSON.stringify(csvHeaders || {})} />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <button type="submit" form="downloadForm" className="Breadcrumbs-download" value="Submit">
          <div className="Breadcrumbs-downloadIcon">
            <DownloadIcon />
          </div>
          Download Progress
        </button>
      </div>
    );

    const breadcrumbs = [];

    if (currentPage === 'intro' || page === 'intro') {
      breadcrumbs.push('Intro');
    } else {
      breadcrumbs.push(<a key="intro" href="#" onClick={e => this.goTo('intro', e)}>Intro</a>);
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('matchFields')) {
      breadcrumbs.push(' / ');
      if (page === 'matchFields') {
        breadcrumbs.push('Match Fields')
      } else {
        breadcrumbs.push(<a key="matchFields" href="#" onClick={e => this.goTo('matchFields', e)}>Match Fields</a>)
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('lint')) {
      breadcrumbs.push(' / ');
      if (page === 'lint') {
        breadcrumbs.push('Lint')
      } else {
        breadcrumbs.push(<a key="lint" href="#" onClick={e => this.goTo('lint', e)}>Lint</a>)
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('matchFields')) {
      breadcrumbs.push(downloadButton)
    }
    return (
      <div className="Breadcrumbs-navigation">
        { breadcrumbs }
      </div>
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
  return bindActionCreators({ navigateTo }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Breadcrumbs);
