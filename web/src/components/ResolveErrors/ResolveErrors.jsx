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
// Remove this depencency
import { resolveColumn, resolveRow, navigateTo } from '../../actions/RedcapLinterActions';

class ResolveErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if ('loading' in nextProps) {
      return { loading: nextProps.loading };
    }
    return null;
  }

  componentDidMount() {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      workingColumn,
      workingRow,
      malformedSheets,
      columnsInError,
      rowsInError,
      resolveColumn,
      resolveRow,
    } = this.props;
    if (workingColumn || workingRow) {
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
        nextSheetName,
        nextColumn,
        action: 'continue',
      };
      // TODO Call on resolveRow if there are no column errors
      resolveColumn(payload);
    } else if (!workingRow && Object.keys(rowsInError).length > 0) {
      // TODO take workingSheetName from props
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

  render() {
    const {
      columnsInError,
      fieldErrors,
      rowsInError,
      navigateTo,
    } = this.props;
    const {
      loading,
    } = this.state;
    let content = '';
    // TODO rework the logic here
    if (loading) {
      content = <Spin tip="Loading..." />;
    } else if (fieldErrors && ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox'].includes(fieldErrors.fieldType)) {
      content = <MatchChoices />;
    } else if (fieldErrors && ['text', 'notes'].includes(fieldErrors.fieldType)) {
      content = <TextValidation />;
    } else if (Object.keys(rowsInError).length > 0) {
      content = <ResolveRow />;
    } else if (Object.keys(columnsInError).length === 0 && Object.keys(rowsInError).length === 0) {
      navigateTo('finish');
    }
    return (
      <div className="ResolveErrors-container">
        { content }
        <TabbedDatatable />
      </div>
    );
  }
}

ResolveErrors.propTypes = {
  cellsWithErrors: PropTypes.object,
  columnsInError: PropTypes.object,
  workingColumn: PropTypes.string,
};

ResolveErrors.defaultProps = {
  cellsWithErrors: {},
  columnsInError: {},
  workingColumn: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, resolveRow, navigateTo }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ResolveErrors);
