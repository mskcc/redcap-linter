import React, { Component } from 'react';
import './RowResolver.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import { updateValue, acceptRowMatches, filterRow } from '../../../actions/REDCapLinterActions';
import { calculateSelectStyles } from '../../../utils/utils';

class RowResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Field',
          key: 'Field',
          render: (text, record) => <Cell cellData={record.Field} hasError={false} />,
        },
        {
          title: 'Validation',
          key: 'Validation',
          width: '300px',
          render: (text, record) => this.renderValidation('Field', record),
        },
        {
          title: 'Current',
          key: 'Current',
          width: '100px',
          render: (text, record) => <Cell cellData={record.Value} hasError />,
        },
        {
          title: 'Value',
          key: 'Value',
          width: '200px',
          render: (text, record) => this.renderInput(record),
        },
      ],
    };

    this.acceptMatches = this.acceptMatches.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { workingRow, workingSheetName } = prevState;
    if (nextProps.workingRow !== workingRow || nextProps.workingSheetName !== workingSheetName) {
      return {
        matchedRowValueMap: {},
        workingRow: nextProps.workingRow,
        workingSheetName: nextProps.workingSheetName,
      };
    }
    return null;
  }

  onFocus() {
    const { workingSheetName, workingRow, filterRow } = this.props;
    filterRow(workingSheetName, workingRow);
  }

  onBlur() {
    const { workingSheetName, filterRow } = this.props;
    filterRow(workingSheetName, -1);
  }

  acceptMatches() {
    const { matchedRowValueMap, acceptRowMatches } = this.props;
    acceptRowMatches({ matchedRowValueMap });
  }

  handleSelectChange(field, e) {
    const {
      matchedRowValueMap, workingSheetName, workingRow, updateValue,
    } = this.props;
    matchedRowValueMap[workingSheetName] = matchedRowValueMap[workingSheetName] || {};
    matchedRowValueMap[workingSheetName][workingRow] = matchedRowValueMap[workingSheetName][workingRow] || {};
    matchedRowValueMap[workingSheetName][workingRow][field] = e.value;
    updateValue({ matchedRowValueMap });
    // TODO Call on action here
  }

  handleChange(field, e) {
    const value = e.target.value;
    const {
      matchedRowValueMap, workingSheetName, workingRow, updateValue,
    } = this.props;
    matchedRowValueMap[workingSheetName] = matchedRowValueMap[workingSheetName] || {};
    matchedRowValueMap[workingSheetName][workingRow] = matchedRowValueMap[workingSheetName][workingRow] || {};
    matchedRowValueMap[workingSheetName][workingRow][field] = value;
    updateValue({ matchedRowValueMap });
    // TODO Call on action here
  }

  renderValidation(header, record) {
    const { ddData } = this.props;
    const fieldName = record.Field;
    const ddField = ddData.find(field => field.field_name === fieldName);
    if (!ddField.text_validation) {
      return 'None';
    }
    return (
      <div className="RowResolver-textValidation">
        <span className="RowResolver-textValidationRange">
          <b>Validation</b>
          {`: ${ddField.text_validation}`}
        </span>
        |
        <span className="RowResolver-textValidationRange">
          <b>Required</b>
          {`: ${ddField.required ? 'True' : 'False'}`}
        </span>
        <br />
        <span className="RowResolver-textValidationRange">
          <b>Min</b>
          {`: ${ddField.text_min || 'None'}`}
        </span>
        |
        <span className="RowResolver-textValidationRange">
          <b>Max</b>
          {`: ${ddField.text_max || 'None'}`}
        </span>
      </div>
    );
  }

  renderInput(record) {
    const {
      matchedRowValueMap, workingSheetName, workingRow, ddData,
    } = this.props;
    const fieldName = record.Field;
    const ddField = ddData.find(field => field.field_name === fieldName);

    // TODO Get value from sheet data if exists
    let valueMap = {};
    if (matchedRowValueMap[workingSheetName] && matchedRowValueMap[workingSheetName][workingRow]) {
      valueMap = matchedRowValueMap[workingSheetName][workingRow];
    }
    const value = valueMap[fieldName] || '';
    let selectedValue = null;
    if (ddField.choices_dict) {
      const options = [];
      Object.keys(ddField.choices_dict).forEach((choice) => {
        const label = (
          <span>
            <b>{choice}</b>
            <span style={{ fontWeight: 'lighter' }}>{` | ${ddField.choices_dict[choice]}`}</span>
          </span>
        );
        if (value === choice) {
          selectedValue = { value: choice, label };
        }
        options.push({
          value: choice,
          label,
        });
      });

      const selectStyles = calculateSelectStyles(options);

      return (
        <Select
          options={options}
          isSearchable
          value={selectedValue}
          onFocus={e => this.onFocus(e)}
          onBlur={e => this.onBlur(e)}
          onChange={e => this.handleSelectChange(fieldName, e)}
          styles={selectStyles}
          placeholder="Select..."
        />
      );
    }
    return (
      <Input
        className="RowResolver-input"
        type="text"
        onFocus={e => this.onFocus(e)}
        onBlur={e => this.onBlur(e)}
        value={value}
        onChange={e => this.handleChange(fieldName, e)}
      />
    );
  }

  render() {
    const {
      matchedRowValueMap,
      workingSheetName,
      workingRow,
      cellsWithErrors,
      jsonData,
      fieldToValueMap,
    } = this.props;
    const { search, columns } = this.state;

    let valueMap = {};
    if (matchedRowValueMap[workingSheetName] && matchedRowValueMap[workingSheetName][workingRow]) {
      valueMap = matchedRowValueMap[workingSheetName][workingRow];
    }

    const row = jsonData[workingSheetName][workingRow];
    const currentRowErrors = cellsWithErrors[workingSheetName][workingRow];

    let savedValueMap = {};
    if (fieldToValueMap[workingSheetName] && fieldToValueMap[workingSheetName][workingRow]) {
      savedValueMap = fieldToValueMap[workingSheetName][workingRow];
    }

    const tableData = Object.keys(row).reduce((filtered, field) => {
      if (
        (currentRowErrors[field] && !savedValueMap[field])
        || (savedValueMap.hasOwnProperty(field) && !savedValueMap[field])
      ) {
        filtered.push({
          Field: field,
          Value: row[field],
        });
      }
      return filtered;
    }, []);

    let data = tableData;
    if (search) {
      data = data.filter(row => row.Field.includes(search));
    }

    let disabled = true;
    if (Object.keys(valueMap).length > 0) {
      disabled = false;
    }

    return (
      <div className="RowResolver-table">
        <div className="RowResolver-tableTitle">
          <div className="RowResolver-searchBar">
            {'Search: '}
            <Input
              className="App-tableSearchBar"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              this.acceptMatches();
            }}
            className="App-submitButton RowResolver-updateAll"
          >
            Update All
          </button>
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

RowResolver.propTypes = {
  fieldToValueMap: PropTypes.objectOf(PropTypes.object),
  matchedRowValueMap: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.array),
  ddData: PropTypes.arrayOf(PropTypes.object),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingRow: PropTypes.number,
};

RowResolver.defaultProps = {
  fieldToValueMap: {},
  matchedRowValueMap: {},
  jsonData: [],
  ddData: [],
  cellsWithErrors: {},
  workingSheetName: '',
  workingRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ updateValue, filterRow, acceptRowMatches }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RowResolver);
