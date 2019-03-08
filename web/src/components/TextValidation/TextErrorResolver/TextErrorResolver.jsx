import React, { Component } from 'react';
import './TextErrorResolver.scss';
import '../../../App.scss';
import { Table, Input } from 'antd';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Select from 'react-select';
import Cell from '../../Cell/Cell';
import ErrorSelector from '../../ErrorSelector/ErrorSelector';

import {
  correctValue,
  filterTable,
} from '../../../actions/RedcapLinterActions';

class TextErrorResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valueMap: {},
      removedValue: '',
      search: '',
      columns: [{
        title: 'Original Value',
        key: 'Original Value',
        render: (text, record) => (this.renderCell('Original Value', record)),
      },
      {
        title: 'Corrected Value',
        key: 'Corrected Value',
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

  // TODO Add button to batch this

  onBlur(e) {
    const {
      filterTable,
    } = this.props;
    filterTable('');
  }

  onFocus(originalValue, e) {
    const {
      filterTable,
    } = this.props;
    filterTable(originalValue);
  }

  handleCorrectAll() {
    const {
      valueMap,
    } = this.state;
    const {
      correctValue,
    } = this.props;
    correctValue(valueMap);
  }

  handleCorrect(originalValue) {
    const {
      valueMap,
    } = this.state;
    const {
      correctValue,
    } = this.props;
    const payload = {};
    payload[originalValue] = valueMap[originalValue];
    correctValue(payload);
  }

  handleRemove(originalValue) {
    const {
      removedValue,
    } = this.state;
    const {
      correctValue,
    } = this.props;
    let payload = {};
    payload[originalValue] = removedValue;
    correctValue(payload);
  }

  handleChange(originalValue, e) {
    const {
      valueMap,
    } = this.state;
    valueMap[originalValue] = e.target.value;
    this.setState({ valueMap });
  }

  renderCell(header, record) {
    return (
      <Cell
        cellData={record[header]}
        editable={false}
      />
    );
  }

  renderInput(record) {
    const {
      valueMap,
    } = this.state;
    const originalValue = record['Original Value'];
    const value = valueMap[originalValue] || '';
    return (
      <Input
        className="TextErrorResolver-input"
        key={`${record['Original Value']}`}
        type="text"
        value={value}
        onBlur={this.onBlur.bind(this)}
        onFocus={this.onFocus.bind(this, originalValue)}
        onChange={this.handleChange.bind(this, originalValue)}
      />
    );
  }

  renderMatchButton(record) {
    const originalValue = record['Original Value'];
    const {
      valueMap,
    } = this.state;
    let disabled = true;
    if (valueMap[originalValue]) {
      disabled = false;
    }
    return (
      <div className="TextErrorResolver-buttons">
        <button type="button" disabled={disabled} onClick={e => this.handleCorrect(originalValue, e)} className="App-submitButton">Correct</button>
        <button type="button" onClick={e => this.handleRemove(originalValue, e)} className="TextErrorResolver-noMatchButton">Remove</button>
      </div>
    );
  }

  render() {
    const {
      workingSheetName,
      workingColumn,
      originalToCorrectedValueMap,
      columnsInError,
      recordsMissingRequiredData,
      fieldErrors,
    } = this.props;
    const {
      search,
      columns,
      valueMap,
    } = this.state;

    let currentMap = {};
    if (originalToCorrectedValueMap[workingSheetName] && originalToCorrectedValueMap[workingSheetName][workingColumn]) {
      currentMap = originalToCorrectedValueMap[workingSheetName][workingColumn];
    }

    const tableData = fieldErrors.textErrors.reduce((filtered, value) => {
      if (!Object.keys(currentMap).includes(value.toString())) {
        filtered.push({
          'Original Value': value,
        });
      }
      return filtered;
    }, []);

    let disabled = true;
    if (Object.keys(valueMap).length > 0) {
      disabled = false;
    }

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Original Value'].toString().includes(search));
    }

    return (
      <div className="TextErrorResolver-table">
        <div className="TextErrorResolver-tableTitle">
          <div className="TextErrorResolver-searchBar">
            Search: <Input className="App-tableSearchBar" value={this.state.search} onChange={e => this.setState({search: e.target.value})} />
          </div>
          <div className="TextErrorResolver-textValidation">
            <span className="TextErrorResolver-textValidationRange"><b>Validation</b>: { fieldErrors.textValidation }</span>
            |
            <span className="TextErrorResolver-textValidationRange"><b>Required</b>: { fieldErrors.required ? 'True' : 'False' }</span>
            <br />
            <span className="TextErrorResolver-textValidationRange"><b>Min</b>: { fieldErrors.textValidationMin || 'None' }</span>
            |
            <span className="TextErrorResolver-textValidationRange"><b>Max</b>: { fieldErrors.textValidationMax || 'None' }</span>
          </div>
          <div className="TextErrorResolver-tableLabel"><ErrorSelector /></div>
          <button type="button" disabled={disabled} onClick={this.handleCorrectAll.bind(this)} className="App-submitButton TextErrorResolver-correctAll">Correct All</button>
        </div>
        <Table size="small" columns={columns} dataSource={data} />
      </div>
    );
  }
}

TextErrorResolver.propTypes = {
  fieldErrors: PropTypes.object,
  originalToCorrectedValueMap: PropTypes.object,
};

TextErrorResolver.defaultProps = {
  fieldErrors: {},
  originalToCorrectedValueMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ correctValue, filterTable }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(TextErrorResolver);
