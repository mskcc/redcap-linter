import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Tab } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Datatable from '../Datatable/Datatable';
import './TabbedDatatable.scss';
import { postForm } from '../../actions/RedcapLinterActions';

class TabbedDatatable extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const {
      csvHeaders,
      jsonData,
      ddHeaders,
      ddData,
      cellsWithErrors,
      recordFieldsNotInRedcap,
      allErrors,
      sheetsNotInRedcap,
      workingSheetName,
      workingColumn,
      filter,
      formNames,
    } = this.props;
    const sheets = Object.keys(csvHeaders);
    const panes = [];
    let activeIdx = 0;
    if (sheets.indexOf(workingSheetName) > 0) {
      activeIdx = sheets.indexOf(workingSheetName);
    }
    if (sheets && sheets.length > 0) {
      for (let i = 0; i < sheets.length; i++) {
        const sheetName = sheets[i];
        let tableFilter = '';
        let filterColumn = '';
        if (i === activeIdx && filter) {
          tableFilter = filter;
          filterColumn = workingColumn;
        }
        let tab = sheetName;
        let tData = [];
        const tHeaders = csvHeaders[sheetName];
        if (jsonData && jsonData[sheetName]) {
          // TODO Find a better way to do this!!!
          tData = jsonData[sheetName];
        }
        let tableErrors = [];
        if (cellsWithErrors && cellsWithErrors[sheetName]) {
          tableErrors = cellsWithErrors[sheetName];
        }
        let tableFieldsNotInRedcap = [];
        if (recordFieldsNotInRedcap && recordFieldsNotInRedcap[sheetName]) {
          tableFieldsNotInRedcap = recordFieldsNotInRedcap[sheetName];
        }
        // TODO make this a CSS class that works with react-tabs
        const tabStyle = { };
        let sheetInError = false;
        if (sheetsNotInRedcap.includes(sheetName)) {
          sheetInError = true;

          const defaultOption = {
            value: sheetName,
            label: sheetName,
          };

          const options = formNames.map(sheet => ({
            value: sheet,
            label: sheet,
          }));
          options.unshift(defaultOption);

          const tabWidth = 8 * sheetName.length + 60;
          const longestOption = formNames.sort((a, b) => b.length - a.length)[0];
          const menuWidth = 8 * longestOption + 60;

          const customStyles = {
            control: provided => ({
              ...provided,
              border: 'none',
              boxShadow: 'none',
            }),
            menu: provided => ({
              // none of react-select's styles are passed to <Control />
              ...provided,
              width: `${menuWidth}px`,
            }),
          };

          tab = [
            <Select
              key={`${sheetName}`}
              options={options}
              styles={customStyles}
              defaultValue={defaultOption}
            />,
          ];

          tabStyle.color = '#E5153E';
          tabStyle.minWidth = `${tabWidth}px`;
        }
        panes.push({
          menuItem: sheetName,
          render: () => (
            <Datatable
              sheetName={`${sheetName}`}
              headers={tHeaders}
              tableData={tData}
              tableFilter={tableFilter}
              filterColumn={filterColumn}
              tableErrors={tableErrors}
              tableFieldsNotInRedcap={tableFieldsNotInRedcap}
              sheetInError={sheetInError}
            />
          ),
        });
      }
      panes.push({
        menuItem: 'Data-Dictionary',
        render: () => (
          <Datatable
            sheetName="Data-Dictionary"
            headers={ddHeaders}
            tableData={ddData}
            editable={false}
          />
        ),
      });
      if (allErrors.length > 0) {
        panes.push({
          menuItem: 'Errors',
          render: () => (
            <Datatable
              sheetName="All-Errors"
              headers={['Error']}
              tableData={allErrors}
              sheetInError
              editable={false}
            />
          ),
        });
      }
    } else {
      panes.push({
        menuItem: 'Sheet1',
        render: () => (
          <Datatable headers={[]} tableData={[]} />
        ),
      });
    }
    return <Tab className="TabbedDatatable-tabs" activeIndex={activeIdx} menu={{ secondary: true, pointing: true }} panes={panes} />;
  }
}

TabbedDatatable.propTypes = {
  csvHeaders: PropTypes.object.isRequired,
  jsonData: PropTypes.object,
  ddHeaders: PropTypes.array,
  ddData: PropTypes.array,
  cellsWithErrors: PropTypes.object,
  recordFieldsNotInRedcap: PropTypes.object,
  allErrors: PropTypes.array,
  sheetsNotInRedcap: PropTypes.array,
  formNames: PropTypes.array,
};

TabbedDatatable.defaultProps = {
  jsonData: {},
  ddHeaders: [],
  ddData: [],
  cellsWithErrors: {},
  recordFieldsNotInRedcap: {},
  allErrors: [],
  sheetsNotInRedcap: [],
  formNames: [],
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TabbedDatatable);
