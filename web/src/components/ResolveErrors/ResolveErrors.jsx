import React, { Component } from 'react';
import './ResolveErrors.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import MatchChoices from '../MatchChoices/MatchChoices';
import TextValidation from '../TextValidation/TextValidation';
import ResolveRow from '../ResolveRow/ResolveRow';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import { navigateTo } from '../../actions/REDCapLinterActions';
import { resolveColumn, resolveRow } from '../../actions/ResolveActions';

class ResolveErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rendered: false,
      loading: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if ('loading' in nextProps) {
      return { loading: nextProps.loading };
    }
    return null;
  }

  // componentDidMount() {
  //   this.setState({ rendered: true });
  // }

  componentDidMount() {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      workingColumn,
      workingRow,
      malformedSheets,
      decodedRecords,
      columnsInError,
      rowsInError,
      resolveColumn,
      resolveRow,
    } = this.props;
    if (workingColumn || workingRow >= 0) {
      return;
    }
    if (!workingColumn && Object.keys(columnsInError).length > 0) {
      const nextSheetName = Object.keys(columnsInError)[0];
      const nextColumn = columnsInError[nextSheetName][0];
      const payload = {
        jsonData,
        projectInfo,
        malformedSheets,
        ddData,
        csvHeaders,
        rowsInError,
        columnsInError,
        decodedRecords,
        nextSheetName,
        nextColumn,
        action: 'continue',
      };
      resolveColumn(payload);
    } else if (workingRow < 0 && Object.keys(rowsInError).length > 0) {
      const nextSheetName = Object.keys(rowsInError)[0];
      const nextRow = rowsInError[nextSheetName][0];
      const payload = {
        jsonData,
        projectInfo,
        columnsInError,
        malformedSheets,
        rowsInError,
        ddData,
        csvHeaders,
        nextSheetName,
        nextRow,
        action: 'continue',
      };
      resolveRow(payload);
    }
  }

  continue() {
    const { navigateTo } = this.props;

    navigateTo('merge');
  }

  render() {
    const { columnsInError, fieldErrors, rowsInError } = this.props;
    const { loading } = this.state;
    let content = '';
    if (loading) {
      content = <Spin tip="Loading..." />;
    } else if (
      fieldErrors
      && ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox'].includes(fieldErrors.fieldType)
    ) {
      content = <MatchChoices />;
    } else if (fieldErrors && ['text', 'notes'].includes(fieldErrors.fieldType)) {
      content = <TextValidation />;
    } else if (Object.keys(rowsInError).length > 0) {
      content = <ResolveRow />;
    } else if (Object.keys(columnsInError).length === 0 && Object.keys(rowsInError).length === 0) {
      content = (
        <div>
          <p>Nothing to Lint</p>
          <button type="button" onClick={this.continue.bind(this)} className="App-submitButton">
            Continue
          </button>
        </div>
      );
    }
    return (
      <div className="ResolveErrors-container">
        {content}
        <TabbedDatatable />
      </div>
    );
  }
}

ResolveErrors.propTypes = {
  ddData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  decodedRecords: PropTypes.objectOf(PropTypes.array),
  malformedSheets: PropTypes.arrayOf(PropTypes.string),
  workingColumn: PropTypes.string,
  workingRow: PropTypes.number,
};

ResolveErrors.defaultProps = {
  ddData: [],
  jsonData: {},
  projectInfo: {},
  csvHeaders: {},
  fieldErrors: {},
  decodedRecords: {},
  columnsInError: {},
  rowsInError: {},
  malformedSheets: [],
  workingColumn: '',
  workingRow: -1,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, resolveRow, navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ResolveErrors);
