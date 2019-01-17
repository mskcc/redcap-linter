import React, { Component } from 'react';
import './ResolveErrors.css';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
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
      resolveColumn
    } = this.props;
    if (!workingColumn && Object.keys(columnsInError).length > 0) {
      const sheetName = Object.keys(columnsInError)[0];
      const nextColumn = columnsInError[sheetName][0];
      const payload = {
        jsonData,
        projectInfo,
        ddData,
        csvHeaders,
        workingColumn: nextColumn,
      };
      resolveColumn(payload);
    }
  }

  render() {
    const { workingColumn } = this.props;

    return (
      <div className="ResolveErrors-container">
        <div className="ResolveErrors-resolveError">
          { workingColumn }
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
