import React, { Component } from 'react';
import './ActionMenu.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import { Menu, Icon, Button } from 'antd';
import { resolveColumn, resolveRow, navigateTo } from '../../actions/RedcapLinterActions';

class ActionMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workingColumn: '',
      workingSheetName: '',
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      workingColumn,
      workingSheetName,
    } = prevState;
    if (nextProps.workingColumn !== workingColumn || nextProps.workingSheetName !== workingSheetName) {
      return { workingColumn: nextProps.workingColumn, workingSheetName: nextProps.workingSheetName};
    }
    return null;
  }

  changeResolve(e) {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      rowsInError,
      columnsInError,
      resolveRow,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      projectInfo,
      columnsInError,
      nextColumn: e.value.column,
      nextRow: e.value.rowNum,
      nextSheetName: e.value.sheet,
      rowsInError,
      ddData,
      csvHeaders,
      action: 'continue',
    };
    if ('rowNum' in e.value) {
      resolveRow(payload);
    } else {
      resolveColumn(payload);
    }
  }

  goTo(page) {
    const {
      navigateTo,
    } = this.props;
    navigateTo(page);
  }

  render() {
    const {
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      fieldToValueMap,
      rowsInError,
      workingSheetName,
      workingColumn,
      workingRow,
      columnsInError,
      page,
      jsonData,
      ddData,
      dataFieldToRedcapFieldMap,
      noMatchRedcapFields,
      csvHeaders,
      cellsWithErrors,
      recordFieldsNotInRedcap,
      dataFileName,
    } = this.props;

    const options = [];
    let allErrors = [];
    Object.keys(columnsInError).forEach((sheet) => {
      const subOptions = [];
      columnsInError[sheet].forEach((columnInError) => {
        subOptions.push({
          value: { sheet: sheet, column: columnInError },
          label: columnInError,
        });
      });
      const choiceMap = dataFieldToChoiceMap[sheet] || {};
      Object.keys(choiceMap).reduce((filtered, column) => {
        if (!columnsInError[sheet].includes(column)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet: sheet, column: column },
            label: column,
            color: '#237804',
          })
        }
        return filtered;
      }, subOptions);

      const valueMap = originalToCorrectedValueMap[sheet] || {};
      Object.keys(valueMap).reduce((filtered, column) => {
        if (!columnsInError[sheet].includes(column)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet: sheet, column: column },
            label: column,
            color: '#237804',
          })
        }
        return filtered;
      }, subOptions);

      options.push({
        label: `${sheet} | Column Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(columnsInError[sheet]);
    });

    Object.keys(rowsInError).forEach((sheet) => {
      const subOptions = [];
      rowsInError[sheet].forEach((rowNumber) => {
        subOptions.push({
          value: { sheet: sheet, rowNum: rowNumber },
          label: rowNumber+2,
        });
      });
      const valueMap = fieldToValueMap[sheet] || {};
      Object.keys(valueMap).reduce((filtered, row) => {
        const rowNum = Number(row);
        if (!rowsInError[sheet].includes(rowNum)) {
          // All errors in column are resolved
          filtered.push({
            value: { sheet: sheet, rowNum: rowNum },
            label: rowNum + 2,
            color: '#237804',
          })
        }
        return filtered;
      }, subOptions);
      options.push({
        label: `${sheet} | Row Errors`,
        options: subOptions,
      });
      allErrors = allErrors.concat(rowsInError[sheet]);
    });

    let selectedValue = {}
    if (workingColumn) {
      selectedValue = {
        value: { sheet: workingSheetName, column: workingColumn },
        label: workingColumn,
      };
    } else if (workingRow !== '') {
      selectedValue = {
        value: { sheet: workingSheetName, rowNum: workingRow },
        label: workingRow+2,
      };
    }

    const longestOption = allErrors.sort((a, b) => b.length - a.length)[0];
    const selectWidth = 8 * longestOption + 60;

    const selectStyles = {
      control: provided => ({
        ...provided,
        minWidth: `${selectWidth}px`,
      }),
      menu: provided => ({
        // none of react-select's styles are passed to <Control />
        ...provided,
        minWidth: `${selectWidth}px`,
      }),
      option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        return {
          ...styles,
          color: data.color,
        };
      },
    };

    const downloadLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_progress`;

    const downloadMappingsLink = `${process.env.REDCAP_LINTER_HOST}:${process.env.REDCAP_LINTER_PORT}/download_mappings`;

    const downloadButton = (
      <div key="downloadProgressButton">
        <form id="downloadForm" action={downloadLink} className="Breadcrumbs-hidden" method="POST">
          <input key="jsonData" name="jsonData" type="hidden" value={JSON.stringify(jsonData || {})} />
          <input key="dataFieldToRedcapFieldMap" name="dataFieldToRedcapFieldMap" type="hidden" value={JSON.stringify(dataFieldToRedcapFieldMap)} />
          <input key="csvHeaders" name="csvHeaders" type="hidden" value={JSON.stringify(csvHeaders || {})} />
          <input key="ddData" name="ddData" type="hidden" value={JSON.stringify(ddData || {})} />
          <input key="cellsWithErrors" name="cellsWithErrors" type="hidden" value={JSON.stringify(cellsWithErrors || {})} />
          <input key="recordFieldsNotInRedcap" name="recordFieldsNotInRedcap" type="hidden" value={JSON.stringify(recordFieldsNotInRedcap || {})} />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <form id="downloadMappingsForm" action={downloadMappingsLink} className="Breadcrumbs-hidden" method="POST">
          <input key="dataFieldToRedcapFieldMap" name="dataFieldToRedcapFieldMap" type="hidden" value={JSON.stringify(dataFieldToRedcapFieldMap)} />
          <input key="noMatchRedcapFields" name="noMatchRedcapFields" type="hidden" value={JSON.stringify(noMatchRedcapFields)} />
          <input key="dataFieldToChoiceMap" name="dataFieldToChoiceMap" type="hidden" value={JSON.stringify(dataFieldToChoiceMap)} />
          <input key="originalToCorrectedValueMap" name="originalToCorrectedValueMap" type="hidden" value={JSON.stringify(originalToCorrectedValueMap)} />
          <input key="dataFileName" name="dataFileName" type="hidden" value={dataFileName || ''} />
        </form>
        <Menu className="ActionMenu-menu" mode="vertical">
          <Menu.Item key="downloadMappings"><span><Icon type="download" /></span>
            <Button htmlType="submit" form="downloadMappingsForm" value="Submit" className="Breadcrumbs-button">
              Download Mappings
            </Button>
          </Menu.Item>
          <Menu.Item key="downloadProgress"><span><Icon type="download" /></span>
            <Button htmlType="submit" form="downloadForm" value="Submit" className="Breadcrumbs-button">
              Download Progress
            </Button>
          </Menu.Item>
          <Menu.Item key="finishResolving"><span><Icon type="check" /></span>
            <Button htmlType="submit" onClick={e => this.goTo('finish', e)} value="Submit" className="Breadcrumbs-button">
              Finish Resolving
            </Button>
          </Menu.Item>
        </Menu>
      </div>
    );

    return (
      <div className="ActionMenu-column">
        { downloadButton }
      </div>
    );
  }
}

ActionMenu.propTypes = {
  fieldErrors: PropTypes.object,
  dataFieldToChoiceMap: PropTypes.object,
  noMatchRedcapFields: PropTypes.array,
  originalToCorrectedValueMap: PropTypes.object,
  columnsInError: PropTypes.object,
  rowsInError: PropTypes.object,
  fieldToValueMap: PropTypes.object,
};

ActionMenu.defaultProps = {
  fieldErrors: {},
  columnsInError: {},
  rowsInError: {},
  dataFieldToChoiceMap: {},
  noMatchRedcapFields: [],
  originalToCorrectedValueMap: {},
  fieldToValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, resolveRow, navigateTo }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionMenu);
