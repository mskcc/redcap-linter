import React, { Component } from 'react';
import './ResolveErrors.scss';
import '../../App.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import MatchChoices from '../MatchChoices/MatchChoices';
import TextValidation from '../TextValidation/TextValidation';
import MissingRequired from '../MissingRequired/MissingRequired';
import ErrorsResolved from '../ErrorsResolved/ErrorsResolved';
import TabbedDatatable from '../TabbedDatatable/TabbedDatatable';
import { resolveColumn } from '../../actions/RedcapLinterActions';

class ResolveErrors extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  componentDidMount() {
    const {
      jsonData,
      projectInfo,
      ddData,
      csvHeaders,
      workingColumn,
      columnsInError,
      resolveColumn,
    } = this.props;
    if (!workingColumn && Object.keys(columnsInError).length > 0) {
      const nextSheetName = Object.keys(columnsInError)[0];
      const nextColumn = columnsInError[nextSheetName][0];
      const payload = {
        jsonData,
        projectInfo,
        ddData,
        csvHeaders,
        columnsInError,
        nextSheetName,
        nextColumn,
      };
      resolveColumn(payload);
    }
  }

  render() {
    const {
      columnsInError,
      fieldErrors,
      recordsMissingRequiredData,
    } = this.props;
    let content = '';
    if (recordsMissingRequiredData) {
      content = <MissingRequired />;
    }
    // if (Object.keys(columnsInError).length === 0) {
    //   content = <ErrorsResolved />;
    // } else if (fieldErrors && ['radio', 'dropdown', 'yesno', 'truefalse', 'checkbox'].includes(fieldErrors.fieldType)) {
    //   content = <MatchChoices />;
    // } else if (fieldErrors && ['text', 'notes'].includes(fieldErrors.fieldType)) {
    //   content = <TextValidation />;
    // } else if (recordsMissingRequiredData) {
    //   content = <MissingRequired />;
    // } else {
    //   content = <ErrorsResolved />;
    // }
    return (
      <div className="ResolveErrors-container">
        <div className="ResolveErrors-resolveError">
          { content }
        </div>
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
  return bindActionCreators({ resolveColumn }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ResolveErrors);
