import React, { Component } from 'react';
import './RequiredResolver.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import ErrorSelector from '../../ErrorSelector/ErrorSelector';
import { updateValue, filterRow } from '../../../actions/RedcapLinterActions';

class RequiredResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valueMap: {},
      search: '',
      columns: [{
        title: 'Field',
        key: 'Field',
        render: (text, record) => (this.renderCell('Field', record)),
      },
      {
        title: 'Validation',
        key: 'Validation',
        width: '300px',
        render: (text, record) => (this.renderValidation('Field', record)),
      },
      {
        title: 'Current',
        key: 'Current',
        width: '100px',
        render: (text, record) => (this.renderCell('Value', record)),
      },
      {
        title: 'Value',
        key: 'Value',
        width: '200px',
        render: (text, record) => (this.renderInput(record)),
      },
      {
        title: 'Action',
        key: 'Action',
        render: (text, record) => (this.renderMatchButton(record)),
      }],
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      workingRow,
      workingSheetName,
    } = prevState;
    if (nextProps.workingRow !== workingRow || nextProps.workingSheetName !== workingSheetName) {
      return { valueMap: {}, workingRow: nextProps.workingRow, workingSheetName: nextProps.workingSheetName };
    }
    return null;
  }

  onFocus(e) {
    const {
      workingSheetName,
      workingRow,
      filterRow,
    } = this.props;
    filterRow(workingSheetName, workingRow);
  }

  onBlur(e) {
    const {
      workingSheetName,
      filterRow,
    } = this.props;
    filterRow(workingSheetName, '');
  }

  handleUpdateAll() {
    const {
      valueMap,
    } = this.state;
    const {
      updateValue,
    } = this.props;
    updateValue(valueMap);
  }

  handleUpdate(field, e) {
    const {
      valueMap,
    } = this.state;
    const {
      updateValue,
    } = this.props;
    const payload = {};
    payload[field] = valueMap[field];
    updateValue(payload);
  }

  handleSelectChange(field, e) {
    const {
      valueMap,
    } = this.state;
    valueMap[field] = e.value;
    this.setState({ valueMap });
  }

  handleChange(field, e) {
    const {
      valueMap,
    } = this.state;
    valueMap[field] = e.target.value;
    this.setState({ valueMap });
  }

  renderValidation(header, record) {
    const {
      ddData,
    } = this.props;
    const fieldName = record['Field'];
    const ddField = ddData.find(field => field.field_name === fieldName);
    if (!ddField.text_validation) {
      return 'None';
    }
    return (
      <div className="RequiredResolver-textValidation">
        <span className="RequiredResolver-textValidationRange"><b>Validation</b>: { ddField.text_validation }</span>
        |
        <span className="RequiredResolver-textValidationRange"><b>Required</b>: { ddField.required ? 'True' : 'False' }</span>
        <br />
        <span className="RequiredResolver-textValidationRange"><b>Min</b>: { ddField.text_min || 'None' }</span>
        |
        <span className="RequiredResolver-textValidationRange"><b>Max</b>: { ddField.text_max || 'None' }</span>
      </div>
    );
  }

  renderCell(header, record) {
    let hasError = false;
    if (header == 'Value') {
      hasError = true;
    }
    return (
      <Cell
        cellData={record[header]}
        editable={false}
        hasError={hasError}
      />
    );
  }

  renderInput(record) {
    const {
      valueMap,
    } = this.state;
    const {
      ddData,
    } = this.props;
    const fieldName = record['Field'];
    const ddField = ddData.find((field) => {
      return field.field_name === fieldName;
    });

    // TODO Get value from sheet data if exists
    const value = valueMap[fieldName] || '';
    if (ddField.choices_dict) {
      const options = [];
      Object.keys(ddField.choices_dict).forEach((choice) => {
        options.push({
          value: choice,
          label: <span><b>{choice}</b> | <span style={{ fontWeight: 'lighter' }}>{ddField.choices_dict[choice]}</span></span>,
        })
      });
      return (
        <Select
          options={options}
          isSearchable
          onFocus={e => this.onFocus(e)}
          onBlur={e => this.onBlur(e)}
          onChange={e => this.handleSelectChange(fieldName, e)}
          placeholder="Select..."
        />
      );
    }
    return (
      <Input
        className="RequiredResolver-input"
        type="text"
        onFocus={e => this.onFocus(e)}
        onBlur={e => this.onBlur(e)}
        value={value}
        onChange={e => this.handleChange(fieldName, e)}
      />
    );
  }

  renderMatchButton(record) {
    const field = record['Field'];
    const {
      valueMap,
    } = this.state;
    let disabled = true;
    if (valueMap[field]) {
      disabled = false;
    }
    return (
      <div className="RequiredResolver-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleUpdate(field, e)} className="App-submitButton">Update</button>
      </div>
    );
  }

  render() {
    const {
      workingSheetName,
      workingRow,
      recordsMissingRequiredData,
      columnsInError,
      row,
      rowErrors,
      fieldToValueMap,
      requiredDdFields,
    } = this.props;
    const {
      search,
      columns,
      valueMap,
    } = this.state;

    let savedValueMap = {};
    if (fieldToValueMap[workingSheetName] && fieldToValueMap[workingSheetName][workingRow]) {
      savedValueMap = fieldToValueMap[workingSheetName][workingRow];
    }

    const tableData = Object.keys(row).reduce((filtered, field) => {
      if ((rowErrors[field] && !savedValueMap[field]) || (savedValueMap.hasOwnProperty(field) && !savedValueMap[field])) {
        filtered.push({
          'Field': field,
          'Value': row[field],
        })
      }
      return filtered;
    }, []);

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Field'].includes(search));
    }

    let disabled = true;
    if (Object.keys(valueMap).length > 0) {
      disabled = false;
    }

    return (
      <div className="RequiredResolver-table">
        <div className="RequiredResolver-tableTitle">
          <div className="RequiredResolver-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </div>
          <div className="RequiredResolver-tableLabel"><ErrorSelector /></div>
          <button type="button" disabled={disabled} onClick={this.handleUpdateAll.bind(this)} className="App-submitButton RequiredResolver-updateAll">Update All</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

RequiredResolver.propTypes = {
  fieldToValueMap: PropTypes.object,
};

RequiredResolver.defaultProps = {
  fieldToValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ updateValue, filterRow }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RequiredResolver);
