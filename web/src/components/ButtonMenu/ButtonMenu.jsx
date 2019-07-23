import React, { Component } from 'react';
import './ButtonMenu.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Menu, Icon, Button } from 'antd';
import { navigateTo, downloadProgress } from '../../actions/REDCapLinterActions';

const { SubMenu } = Menu;

class ButtonMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  goTo(page) {
    const { navigateTo } = this.props;
    navigateTo(page);
  }

  onClick(e) {
    const { downloadProgress } = this.props;
    downloadProgress();
  }

  render() {
    const {
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      jsonData,
      ddData,
      dataFieldToRedcapFieldMap,
      noMatchRedcapFields,
      csvHeaders,
      cellsWithErrors,
      recordFieldsNotInRedcap,
      dataFileName,
    } = this.props;

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_progress`;

    const downloadMappingsLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_mappings`;

    // TODO figure out how to prevent the unload event when downloading progress
    const downloadButton = (
      <div key="downloadProgressButton" className="ButtonMenu-downloadButton">
        <form id="downloadForm" action={downloadLink} className="ButtonMenu-hidden" method="POST">
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
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <form
          id="downloadMappingsForm"
          action={downloadMappingsLink}
          className="ButtonMenu-hidden"
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
            key="noMatchRedcapFields"
            name="noMatchRedcapFields"
            type="hidden"
            value={JSON.stringify(noMatchRedcapFields)}
          />
          <input
            key="originalToCorrectedValueMap"
            name="originalToCorrectedValueMap"
            type="hidden"
            value={JSON.stringify(originalToCorrectedValueMap)}
          />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <Menu className="ButtonMenu-menu" mode="horizontal" style={{ width: 120 }}>
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
                onClick={e => this.onClick(e)}
                value="Submit"
                className="ButtonMenu-button"
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
                onClick={e => this.onClick(e)}
                value="Submit"
                className="ButtonMenu-button"
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
                className="ButtonMenu-button"
              >
                Finish Resolving
              </Button>
            </Menu.Item>
          </SubMenu>
        </Menu>
      </div>
    );

    return <div className="ButtonMenu-column">{downloadButton}</div>;
  }
}

ButtonMenu.propTypes = {
  ddData: PropTypes.arrayOf(PropTypes.object),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  csvHeaders: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  noMatchRedcapFields: PropTypes.arrayOf(PropTypes.string),
  jsonData: PropTypes.objectOf(PropTypes.array),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  recordFieldsNotInRedcap: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFileName: PropTypes.string,
};

ButtonMenu.defaultProps = {
  ddData: [],
  csvHeaders: {},
  dataFieldToRedcapFieldMap: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
  noMatchRedcapFields: [],
  jsonData: {},
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
  dataFileName: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ navigateTo, downloadProgress }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ButtonMenu);
