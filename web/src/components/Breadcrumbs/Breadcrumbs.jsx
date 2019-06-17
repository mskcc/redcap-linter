import React, { Component } from 'react';
import './Breadcrumbs.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import {
  Breadcrumb, Menu, Icon, Button,
} from 'antd';
import { navigateTo } from '../../actions/REDCapLinterActions';

const { SubMenu } = Menu;

class Breadcrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 'intro',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const pages = ['intro', 'matchFields', 'lint', 'merge', 'finish'];
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
    const { navigateTo } = this.props;
    navigateTo(page);
  }

  render() {
    const { page } = this.props;
    const { currentPage } = this.state;
    const pages = ['intro', 'matchFields', 'lint', 'merge', 'finish'];

    const {
      jsonData,
      dataFieldToRedcapFieldMap,
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      csvHeaders,
      ddData,
      dataFileName,
      cellsWithErrors,
      recordFieldsNotInRedcap,
    } = this.props;

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${
      process.env.REDCAP_LINTER_PORT
    }/download_progress`;

    const downloadMappingsLink = `${process.env.REDCAP_LINTER_HOST}:${
      process.env.REDCAP_LINTER_PORT
    }/download_mappings`;

    let downloadButton = '';
    if (page === 'finish') {
      downloadButton = (
        <div key="downloadProgressButton" className="Breadcrumbs-downloadButton">
          <form
            id="downloadForm"
            action={downloadLink}
            className="Breadcrumbs-hidden"
            method="POST"
          >
            <input
              key="jsonData"
              name="jsonData"
              type="hidden"
              value={JSON.stringify(jsonData || {})}
            />
            <input
              key="dataFieldToRedcapFieldMap"
              name="dataFieldToRedcapFieldMap"
              type="hidden"
              value={JSON.stringify(dataFieldToRedcapFieldMap)}
            />
            <input
              key="csvHeaders"
              name="csvHeaders"
              type="hidden"
              value={JSON.stringify(csvHeaders || {})}
            />
            <input key="ddData" name="ddData" type="hidden" value={JSON.stringify(ddData || {})} />
            <input
              key="cellsWithErrors"
              name="cellsWithErrors"
              type="hidden"
              value={JSON.stringify(cellsWithErrors || {})}
            />
            <input
              key="recordFieldsNotInRedcap"
              name="recordFieldsNotInRedcap"
              type="hidden"
              value={JSON.stringify(recordFieldsNotInRedcap || {})}
            />
            <input
              key="dataFileName"
              name="dataFileName"
              type="hidden"
              value={dataFileName || ''}
            />
          </form>
          <form
            id="downloadMappingsForm"
            action={downloadMappingsLink}
            className="Breadcrumbs-hidden"
            method="POST"
          >
            <input
              key="dataFieldToRedcapFieldMap"
              name="dataFieldToRedcapFieldMap"
              type="hidden"
              value={JSON.stringify(dataFieldToRedcapFieldMap)}
            />
            <input
              key="dataFieldToChoiceMap"
              name="dataFieldToChoiceMap"
              type="hidden"
              value={JSON.stringify(dataFieldToChoiceMap)}
            />
            <input
              key="originalToCorrectedValueMap"
              name="originalToCorrectedValueMap"
              type="hidden"
              value={JSON.stringify(originalToCorrectedValueMap)}
            />
            <input
              key="dataFileName"
              name="dataFileName"
              type="hidden"
              value={dataFileName || ''}
            />
          </form>
          <Menu className="Breadcrumbs-menu" mode="horizontal" style={{ width: 120 }}>
            <SubMenu
              key="actions"
              title={(
                <span>
                  <Icon type="down" style={{ fontSize: '10px' }} />
                  Actions
                </span>
)}
            >
              <Menu.Item key="downloadMappings">
                <span>
                  <Icon type="download" />
                </span>
                <Button
                  htmlType="submit"
                  form="downloadMappingsForm"
                  value="Submit"
                  className="Breadcrumbs-button"
                >
                  Download Mappings
                </Button>
              </Menu.Item>
              <Menu.Item key="downloadProgress">
                <span>
                  <Icon type="download" />
                </span>
                <Button
                  htmlType="submit"
                  form="downloadForm"
                  value="Submit"
                  className="Breadcrumbs-button"
                >
                  Download Progress
                </Button>
              </Menu.Item>
              <Menu.Item key="finishResolving">
                <span>
                  <Icon type="check" />
                </span>
                <Button
                  htmlType="submit"
                  onClick={e => this.goTo('finish', e)}
                  value="Submit"
                  className="Breadcrumbs-button"
                >
                  Finish Resolving
                </Button>
              </Menu.Item>
            </SubMenu>
          </Menu>
        </div>
      );
    }

    const breadcrumbs = [];

    if (currentPage === 'intro' || page === 'intro') {
      breadcrumbs.push(<Breadcrumb.Item key="intro">Intro</Breadcrumb.Item>);
    } else {
      breadcrumbs.push(
        <Breadcrumb.Item key="intro">
          <button type="button" className="App-linkButton" onClick={e => this.goTo('intro', e)}>
            Intro
          </button>
        </Breadcrumb.Item>,
      );
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('matchFields')) {
      if (page === 'matchFields') {
        breadcrumbs.push(<Breadcrumb.Item key="matchFields">Match Fields</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(
          <Breadcrumb.Item key="matchFields">
            <button
              type="button"
              className="App-linkButton"
              onClick={e => this.goTo('matchFields', e)}
            >
              Match Fields
            </button>
          </Breadcrumb.Item>,
        );
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('lint')) {
      if (page === 'lint') {
        breadcrumbs.push(<Breadcrumb.Item key="lint">Lint</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(
          <Breadcrumb.Item key="lint">
            <button type="button" className="App-linkButton" onClick={e => this.goTo('lint', e)}>
              Lint
            </button>
          </Breadcrumb.Item>,
        );
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('merge')) {
      if (page === 'merge') {
        breadcrumbs.push(<Breadcrumb.Item key="merge">Merge</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(
          <Breadcrumb.Item key="merge">
            <button type="button" className="App-linkButton" onClick={e => this.goTo('merge', e)}>
              Merge
            </button>
          </Breadcrumb.Item>,
        );
      }
    }

    if (pages.indexOf(currentPage) >= pages.indexOf('finish')) {
      if (page === 'finish') {
        breadcrumbs.push(<Breadcrumb.Item key="finish">Finish</Breadcrumb.Item>);
      } else {
        breadcrumbs.push(
          <Breadcrumb.Item key="finish">
            <button type="button" className="App-linkButton" onClick={e => this.goTo('finish', e)}>
              Finish
            </button>
          </Breadcrumb.Item>,
        );
      }
    }

    let download = null;

    if (pages.indexOf(currentPage) >= pages.indexOf('matchFields')) {
      download = downloadButton;
    }
    return (
      <div className="Breadcrumbs-navigation">
        <Breadcrumb className="Breadcrumbs-links" separator=">">
          {breadcrumbs}
        </Breadcrumb>
        {download}
      </div>
    );
  }
}

Breadcrumbs.propTypes = {
  page: PropTypes.string,
  ddData: PropTypes.arrayOf(PropTypes.object),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  csvHeaders: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.array),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  recordFieldsNotInRedcap: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFileName: PropTypes.string,
};

Breadcrumbs.defaultProps = {
  page: 'intro',
  ddData: [],
  dataFieldToRedcapFieldMap: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
  csvHeaders: {},
  jsonData: {},
  dataFileName: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Breadcrumbs);
