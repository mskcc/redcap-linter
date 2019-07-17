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
        matchedValueMap: {},
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
    const { matchedValueMap, acceptRowMatches } = this.props;
    acceptRowMatches({ matchedValueMap });
  }

  handleSelectChange(field, e) {
    const {
      matchedValueMap, workingSheetName, workingRow, updateValue,
    } = this.props;
    matchedValueMap[workingSheetName] = matchedValueMap[workingSheetName] || {};
    matchedValueMap[workingSheetName][workingRow] = matchedValueMap[workingSheetName][workingRow] || {};
    matchedValueMap[workingSheetName][workingRow][field] = e.value;
    updateValue({ matchedValueMap });
    // TODO Call on action here
  }

  handleChange(field, e) {
    const value = e.target.value;
    const {
      matchedValueMap, workingSheetName, workingRow, updateValue,
    } = this.props;
    matchedValueMap[workingSheetName] = matchedValueMap[workingSheetName] || {};
    matchedValueMap[workingSheetName][workingRow] = matchedValueMap[workingSheetName][workingRow] || {};
    matchedValueMap[workingSheetName][workingRow][field] = value;
    updateValue({ matchedValueMap });
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
      matchedValueMap, workingSheetName, workingRow, ddData,
    } = this.props;
    const fieldName = record.Field;
    const ddField = ddData.find(field => field.field_name === fieldName);

    // TODO Get value from sheet data if exists
    let valueMap = {};
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingRow]) {
      valueMap = matchedValueMap[workingSheetName][workingRow];
    }
    const value = valueMap[fieldName] || '';
    if (ddField.choices_dict) {
      const options = [];
      Object.keys(ddField.choices_dict).forEach((choice) => {
        options.push({
          value: choice,
          label: (
            <span>
              <b>{choice}</b>
              <span style={{ fontWeight: 'lighter' }}>{` | ${ddField.choices_dict[choice]}`}</span>
            </span>
          ),
        });
      });

      const selectStyles = calculateSelectStyles(options);

      return (
        <Select
          options={options}
          isSearchable
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
      matchedValueMap,
      workingSheetName,
      workingRow,
      cellsWithErrors,
      jsonData,
      fieldToValueMap,
    } = this.props;
    const { search, columns } = this.state;

    let valueMap = {};
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingRow]) {
      valueMap = matchedValueMap[workingSheetName][workingRow];
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
  matchedValueMap: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.array),
  ddData: PropTypes.arrayOf(PropTypes.object),
  cellsWithErrors: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingRow: PropTypes.number,
};

RowResolver.defaultProps = {
  fieldToValueMap: {},
  matchedValueMap: {},
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
