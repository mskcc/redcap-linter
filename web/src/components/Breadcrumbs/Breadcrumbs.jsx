import React, { Component } from 'react';
import './Breadcrumbs.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Breadcrumb } from 'antd';
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
    const pages = ['intro', 'matchFields', 'lint', 'finish'];
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
    const pages = ['intro', 'matchFields', 'lint', 'finish']

    const {
      jsonData,
      redcapFieldToDataFieldMap,
      csvHeaders,
      ddData,
      dataFileName,
      cellsWithErrors,
      recordFieldsNotInRedcap,
    } = this.props;

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_progress`;

    const downloadMappingsLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_mappings`;

    const downloadButton = (
      <div key="downloadProgressButton" className="Breadcrumbs-downloadButton">
        <form id="downloadForm" action={downloadLink} className="Breadcrumbs-hidden" method="POST">
          <input key="jsonData" name="jsonData" type="hidden" value={JSON.stringify(jsonData || {})} />
          <input key="redcapFieldToDataFieldMap" name="redcapFieldToDataFieldMap" type="hidden" value={JSON.stringify(redcapFieldToDataFieldMap)} />
          <input key="csvHeaders" name="csvHeaders" type="hidden" value={JSON.stringify(csvHeaders || {})} />
          <input key="ddData" name="ddData" type="hidden" value={JSON.stringify(ddData || {})} />
          <input key="cellsWithErrors" name="cellsWithErrors" type="hidden" value={JSON.stringify(cellsWithErrors || {})} />
          <input key="recordFieldsNotInRedcap" name="recordFieldsNotInRedcap" type="hidden" value={JSON.stringify(recordFieldsNotInRedcap || {})} />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <form id="downloadMappingsForm" action={downloadMappingsLink} className="Breadcrumbs-hidden" method="POST">
          <input key="redcapFieldToDataFieldMap" name="redcapFieldToDataFieldMap" type="hidden" value={JSON.stringify(redcapFieldToDataFieldMap)} />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <button type="submit" form="downloadMappingsForm" className="App-actionButton" value="Submit">
          <div className="Breadcrumbs-buttonText">
            Download Mappings
          </div>
          <div className="Breadcrumbs-downloadIcon">
            <DownloadIcon />
          </div>
        </button>
        <button type="submit" form="downloadForm" className="App-actionButton" value="Submit">
          <div className="Breadcrumbs-buttonText">
            Download Progress
          </div>
          <div className="Breadcrumbs-downloadIcon">
            <DownloadIcon />
          </div>
        </button>
        <button type="submit" onClick={e => this.goTo('finish', e)} className="App-submitButton Breadcrumbs-finish" value="Submit">
            Finish Resolving
        </button>
      </div>
    );

    const breadcrumbs = [];

    if (currentPage === 'intro' || page === 'intro') {
      breadcrumbs.push(<Breadcrumb.Item key="intro">Intro</Breadcrumb.Item>);
    } else {
      breadcrumbs.push(<Breadcrumb.Item key="intro"><a href="#" onClick={e => this.goTo('intro', e)}>Intro</a></Breadcrumb.Item>);
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('matchFields')) {
      if (page === 'matchFields') {
        breadcrumbs.push(<Breadcrumb.Item key="matchFields">Match Fields</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(<Breadcrumb.Item key="matchFields"><a href="#" onClick={e => this.goTo('matchFields', e)}>Match Fields</a></Breadcrumb.Item>);
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('lint')) {
      if (page === 'lint') {
        breadcrumbs.push(<Breadcrumb.Item key="lint">Lint</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(<Breadcrumb.Item key="lint"><a href="#" onClick={e => this.goTo('lint', e)}>Lint</a></Breadcrumb.Item>);
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('finish')) {
      if (page === 'finish') {
        breadcrumbs.push(<Breadcrumb.Item key="finish">Finish</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(<Breadcrumb.Item key="finish"><a href="#" onClick={e => this.goTo('finish', e)}>Finish</a></Breadcrumb.Item>);
      }
    }

    let download = null;

    if (pages.indexOf(currentPage) >= pages.indexOf('lint')) {
      download = downloadButton;
    }
    return (
      <div className="Breadcrumbs-navigation">
        <Breadcrumb className="Breadcrumbs-links">
          { breadcrumbs }
        </Breadcrumb>
        { download }
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
