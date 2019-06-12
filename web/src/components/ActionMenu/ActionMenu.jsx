import React, { Component } from 'react';
import './ActionMenu.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Menu, Icon, Button } from 'antd';
import { navigateTo } from '../../actions/REDCapLinterActions';

class ActionMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workingColumn: '',
      workingSheetName: '',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { workingColumn, workingSheetName } = prevState;
    if (
      nextProps.workingColumn !== workingColumn
      || nextProps.workingSheetName !== workingSheetName
    ) {
      return {
        workingColumn: nextProps.workingColumn,
        workingSheetName: nextProps.workingSheetName,
      };
    }
    return null;
  }

  goTo(page) {
    const { navigateTo } = this.props;
    navigateTo(page);
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

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${
      process.env.REDCAP_LINTER_PORT
    }/download_progress`;

    const downloadMappingsLink = `${process.env.REDCAP_LINTER_HOST}:${
      process.env.REDCAP_LINTER_PORT
    }/download_mappings`;

    const downloadButton = (
      <div key="downloadProgressButton">
        <form id="downloadForm" action={downloadLink} className="Breadcrumbs-hidden" method="POST">
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
            key="noMatchRedcapFields"
            name="noMatchRedcapFields"
            type="hidden"
            value={JSON.stringify(noMatchRedcapFields)}
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
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <Menu className="ActionMenu-menu" mode="vertical">
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
        </Menu>
      </div>
    );

    return <div className="ActionMenu-column">{downloadButton}</div>;
  }
}

ActionMenu.propTypes = {
  ddData: PropTypes.arrayOf(PropTypes.object),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  noMatchRedcapFields: PropTypes.arrayOf(PropTypes.string),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  csvHeaders: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  recordFieldsNotInRedcap: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  dataFileName: PropTypes.string,
};

ActionMenu.defaultProps = {
  ddData: [],
  csvHeaders: {},
  dataFieldToRedcapFieldMap: {},
  dataFieldToChoiceMap: {},
  noMatchRedcapFields: [],
  originalToCorrectedValueMap: {},
  jsonData: {},
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
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
)(ActionMenu);
