import React, { Component } from 'react';
import './TextErrorResolver.scss';
import '../../../App.scss';
import { Table, Input, DatePicker } from 'antd';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Cell from '../../Cell/Cell';
import { isValueValid, disabledDate } from '../../../utils/utils';

import { correctValue, acceptCorrections, filterTable } from '../../../actions/REDCapLinterActions';

class TextErrorResolver extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      columns: [
        {
          title: 'Original Value',
          key: 'Original Value',
          render: (text, record) => <Cell cellData={record['Original Value']} />,
        },
        {
          title: 'Corrected Value',
          key: 'Corrected Value',
          width: '200px',
          render: (text, record) => this.renderInput(record),
        },
        {
          title: 'Action',
          key: 'Action',
          width: 200,
          render: (text, record) => this.renderMatchButton(record),
        },
      ],
    };

    this.handleCorrectAll = this.handleCorrectAll.bind(this);
  }

  onBlur(e) {
    const { filterTable } = this.props;
    filterTable('');
  }

  onFocus(originalValue, e) {
    const { filterTable } = this.props;
    filterTable(originalValue);
  }

  handleCorrectAll() {
    const {
      acceptCorrections,
      matchedValueMap,
      workingSheetName,
      workingColumn,
      fieldErrors,
    } = this.props;
    const validFields = [];
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      Object.keys(matchedValueMap[workingSheetName][workingColumn]).forEach((originalValue) => {
        const value = matchedValueMap[workingSheetName][workingColumn][originalValue];
        if (value && isValueValid(value, fieldErrors)) {
          validFields.push(originalValue);
        }
      });
    }
    acceptCorrections({ matchedValueMap, fields: validFields });
  }

  handleCorrect(originalValue) {
    const { acceptCorrections, matchedValueMap } = this.props;
    acceptCorrections({ matchedValueMap, fields: [originalValue] });
  }

  handleRemove(originalValue) {
    const {
      matchedValueMap, workingSheetName, workingColumn, acceptCorrections,
    } = this.props;
    matchedValueMap[workingSheetName] = matchedValueMap[workingSheetName] || {};
    matchedValueMap[workingSheetName][workingColumn] = matchedValueMap[workingSheetName][workingColumn] || {};
    matchedValueMap[workingSheetName][workingColumn][originalValue] = '';
    acceptCorrections({ matchedValueMap, fields: [originalValue] });
  }

  handleChange(originalValue, e) {
    let value = '';
    if (moment.isMoment(e)) {
      value = e.format('MM-DD-YYYY');
    } else {
      value = e.target.value;
    }
    const {
      matchedValueMap, workingSheetName, workingColumn, correctValue,
    } = this.props;
    matchedValueMap[workingSheetName] = matchedValueMap[workingSheetName] || {};
    matchedValueMap[workingSheetName][workingColumn] = matchedValueMap[workingSheetName][workingColumn] || {};
    matchedValueMap[workingSheetName][workingColumn][originalValue] = value;
    correctValue({ matchedValueMap });
  }

  renderInput(record) {
    const {
      matchedValueMap, workingSheetName, workingColumn, fieldErrors,
    } = this.props;
    const originalValue = record['Original Value'];
    let value = '';
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      value = matchedValueMap[workingSheetName][workingColumn][originalValue];
    }
    const { textValidation } = fieldErrors;
    let validClassName = '';
    if (value) {
      const valid = isValueValid(value, fieldErrors);

      validClassName = valid ? 'TextErrorResolver-valid' : 'TextErrorResolver-invalid';
    }
    let input = (
      <Input
        className={`TextErrorResolver-input ${validClassName}`}
        key={`${record['Original Value']}`}
        type="text"
        value={value}
        onBlur={this.onBlur.bind(this)}
        onFocus={this.onFocus.bind(this, originalValue)}
        onChange={this.handleChange.bind(this, originalValue)}
      />
    );

    if (['date_dmy', 'date_mdy', 'date_ymd'].includes(textValidation)) {
      input = (
        <DatePicker
          value={value ? moment(value) : null}
          onBlur={this.onBlur.bind(this)}
          onFocus={this.onFocus.bind(this, originalValue)}
          onChange={this.handleChange.bind(this, originalValue)}
          disabledDate={e => disabledDate(fieldErrors, e)}
        />
      );
    }

    return input;
  }

  renderMatchButton(record) {
    const originalValue = record['Original Value'];
    const {
      matchedValueMap, workingSheetName, workingColumn, fieldErrors,
    } = this.props;
    let disabled = true;
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      const value = matchedValueMap[workingSheetName][workingColumn][originalValue];
      if (value && isValueValid(value, fieldErrors)) {
        disabled = false;
      }
    }
    let removeDisabled = false;
    if (fieldErrors.required) {
      removeDisabled = true;
    }
    return (
      <div className="TextErrorResolver-buttons">
        <button
          type="button"
          disabled={disabled}
          onClick={e => this.handleCorrect(originalValue, e)}
          className="App-submitButton"
        >
          Correct
        </button>
        <button
          type="button"
          disabled={removeDisabled}
          onClick={e => this.handleRemove(originalValue, e)}
          className="App-actionButton"
        >
          Remove
        </button>
      </div>
    );
  }

  render() {
    const {
      matchedValueMap,
      workingSheetName,
      workingColumn,
      originalToCorrectedValueMap,
      fieldErrors,
    } = this.props;
    const { search, columns } = this.state;

    let currentMap = {};
    if (
      originalToCorrectedValueMap[workingSheetName]
      && originalToCorrectedValueMap[workingSheetName][workingColumn]
    ) {
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
    let unsavedValueMap = {};
    if (matchedValueMap[workingSheetName] && matchedValueMap[workingSheetName][workingColumn]) {
      unsavedValueMap = matchedValueMap[workingSheetName][workingColumn];
    }

    Object.keys(unsavedValueMap).forEach((originalValue) => {
      const value = unsavedValueMap[originalValue];
      if (value && isValueValid(value, fieldErrors)) {
        disabled = false;
      }
    });

    let data = tableData;
    if (search) {
      data = data.filter(row => row['Original Value'].toString().includes(search));
    }

    return (
      <div className="TextErrorResolver-table">
        <div className="TextErrorResolver-tableTitle">
          <div className="TextErrorResolver-searchBar">
            {'Search: '}
            <Input
              className="App-tableSearchBar"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
          </div>
          <div className="TextErrorResolver-textValidation">
            <span className="TextErrorResolver-textValidationRange">
              <b>Validation</b>
              {`: ${fieldErrors.textValidation}`}
            </span>
            |
            <span className="TextErrorResolver-textValidationRange">
              <b>Required</b>
              {`: ${fieldErrors.required ? 'True' : 'False'}`}
            </span>
            <br />
            <span className="TextErrorResolver-textValidationRange">
              <b>Min</b>
              {`: ${fieldErrors.textValidationMin || 'None'}`}
            </span>
            |
            <span className="TextErrorResolver-textValidationRange">
              <b>Max</b>
              {`: ${fieldErrors.textValidationMax || 'None'}`}
            </span>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              this.handleCorrectAll();
            }}
            className="App-submitButton TextErrorResolver-correctAll"
          >
            Correct All
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

TextErrorResolver.propTypes = {
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  matchedValueMap: PropTypes.objectOf(PropTypes.any),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
};

TextErrorResolver.defaultProps = {
  fieldErrors: {},
  originalToCorrectedValueMap: {},
  matchedValueMap: {},
  workingSheetName: '',
  workingColumn: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ correctValue, acceptCorrections, filterTable }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TextErrorResolver);
