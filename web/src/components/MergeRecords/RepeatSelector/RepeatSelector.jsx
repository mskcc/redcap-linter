import React, { Component } from 'react';
import './RepeatSelector.scss';
import '../../../App.scss';
import { Table } from 'antd';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import _ from 'lodash';

import { changeReconciliationColumns } from '../../../actions/REDCapLinterActions';
import { calculateSelectStyles } from '../../../utils/utils';

class RepeatSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Repeatable Instrument',
          key: 'Repeatable Instrument',
          render: (text, record) => RepeatSelector.renderCell('Repeatable Instrument', record),
        },
        {
          title: 'Reconciliation Column(s)',
          key: 'Reconciliation Column(s)',
          width: '150px',
          render: (text, record) => RepeatSelector.renderCell('Reconciliation Column(s)', record),
        },
      ],
    };
  }

  static renderCell(header, cellInfo) {
    let cellValue = '';
    if (Array.isArray(cellInfo[header])) {
      cellValue = cellInfo[header].join(', ');
    } else {
      cellValue = cellInfo[header];
    }
    return <div className="RepeatSelector-cell">{cellValue}</div>;
  }

  changeColumns(instrument, selectedOptions) {
    const { changeReconciliationColumns } = this.props;

    const reconciliationColumns = [];
    selectedOptions.forEach((option) => {
      reconciliationColumns.push(option.value);
    });

    const payload = {
      instrument,
      reconciliationColumns,
    };

    changeReconciliationColumns(payload);
  }

  render() {
    const {
      projectInfo,
      dataFieldToRedcapFieldMap,
      ddData,
      jsonData,
      malformedSheets,
      reconciliationColumns,
    } = this.props;

    const tableData = [];
    const validSheets = _.difference(Object.keys(jsonData), malformedSheets);
    let matchingHeaders = [];
    validSheets.forEach((sheetName) => {
      if (dataFieldToRedcapFieldMap && dataFieldToRedcapFieldMap[sheetName]) {
        matchingHeaders = _.union(
          matchingHeaders,
          Object.values(dataFieldToRedcapFieldMap[sheetName]),
        );
      }
    });

    const repeatableInstruments = projectInfo.repeatable_instruments || [];
    repeatableInstruments.forEach((instrument) => {
      const ddFields = ddData.reduce((filtered, ddField) => {
        if (ddField.form_name === instrument) {
          filtered.push(ddField.field_name);
        }
        return filtered;
      }, []);

      const options = [];
      matchingHeaders.forEach((header) => {
        if (ddFields.includes(header)) {
          options.push({
            value: header,
            label: header,
          });
        }
      });

      const selectedValue = [];
      if (reconciliationColumns && reconciliationColumns[instrument]) {
        reconciliationColumns[instrument].forEach((field) => {
          selectedValue.push({
            value: field,
            label: field,
          });
        });
      }

      const selectStyles = calculateSelectStyles(options);

      const reconciliationColumnSelector = (
        <Select
          options={options}
          styles={selectStyles}
          value={selectedValue}
          isSearchable
          isMulti
          onChange={e => this.changeColumns(instrument, e)}
        />
      );

      tableData.push({
        'Repeatable Instrument': instrument,
        'Reconciliation Column(s)': reconciliationColumnSelector,
      });
    });

    const { search, columns } = this.state;

    let data = tableData;
    if (search) {
      data = data.filter(
        row => row['Repeatable Instrument'].includes(search)
          || String(row['Reconciliation Column(s)']).includes(search),
      );
    }
    return (
      <div className="RepeatSelector-table">
        <div className="RepeatSelector-title">Reconciliation Column(s)</div>
        <div className="RepeatSelector-description">
          For each repeating instrument, choose a column or combination of columns that would act as
          the unique key for the instrument.
        </div>
        <Table
          size="small"
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 5, showSizeChanger: true, showQuickJumper: true }}
        />
      </div>
    );
  }
}

RepeatSelector.propTypes = {
  projectInfo: PropTypes.objectOf(PropTypes.any),
  ddData: PropTypes.arrayOf(PropTypes.object),
  jsonData: PropTypes.objectOf(PropTypes.array),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  reconciliationColumns: PropTypes.objectOf(PropTypes.array),
};

RepeatSelector.defaultProps = {
  projectInfo: {},
  ddData: [],
  jsonData: {},
  dataFieldToRedcapFieldMap: {},
  malformedSheets: [],
  reconciliationColumns: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ changeReconciliationColumns }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RepeatSelector);
