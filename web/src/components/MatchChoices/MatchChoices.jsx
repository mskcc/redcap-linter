import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'antd';
import PropTypes from 'prop-types';
import MatchedChoices from './MatchedChoices/MatchedChoices';
import ChoiceMatcher from './ChoiceMatcher/ChoiceMatcher';
import ActionMenu from '../ActionMenu/ActionMenu';
import './MatchChoices.scss';
import '../../App.scss';
import { removeChoiceMatch, navigateTo } from '../../actions/REDCapLinterActions';
import { resolveColumn } from '../../actions/ResolveActions';

class MatchChoices extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  saveChanges(action) {
    const {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      ddData,
      workingColumn,
      workingSheetName,
      columnsInError,
      rowsInError,
      csvHeaders,
      resolveColumn,
    } = this.props;
    const payload = {
      jsonData,
      dataFieldToChoiceMap,
      projectInfo,
      workingColumn,
      workingSheetName,
      columnsInError,
      rowsInError,
      ddData,
      csvHeaders,
      action,
    };
    resolveColumn(payload);
  }

  forward() {
    const { navigateTo } = this.props;
    navigateTo('merge');
  }

  back() {
    const { navigateTo } = this.props;
    navigateTo('matchFields');
  }

  render() {
    const {
      fieldErrors,
      dataFieldToChoiceMap,
      workingSheetName,
      workingColumn,
      removeChoiceMatch,
    } = this.props;

    if (!workingColumn) {
      return null;
    }

    let matchedChoices = fieldErrors.matchedChoices || [];
    let choiceMap = {};
    if (
      dataFieldToChoiceMap[workingSheetName]
      && dataFieldToChoiceMap[workingSheetName][workingColumn]
    ) {
      choiceMap = dataFieldToChoiceMap[workingSheetName][workingColumn];
    }
    matchedChoices = matchedChoices.map(header => ({
      'Data Field': header,
      'Permissible Value': header,
    }));
    matchedChoices = matchedChoices.concat(
      Object.keys(choiceMap).reduce((filtered, dataField) => {
        if (choiceMap[dataField]) {
          filtered.push({
            'Data Field': dataField,
            'Permissible Value': choiceMap[dataField],
          });
        }
        return filtered;
      }, []),
    );
    matchedChoices = matchedChoices.concat(
      Object.keys(choiceMap).reduce((filtered, dataField) => {
        if (!choiceMap[dataField]) {
          filtered.push({
            'Data Field': dataField,
            'Permissible Value': choiceMap[dataField],
          });
        }
        return filtered;
      }, []),
    );

    return (
      <div>
        <div className="MatchChoices-navigation">
          <button type="button" onClick={this.back.bind(this)} className="App-actionButton">
            <Icon type="left" />
            {' Back to Match Fields'}
          </button>
          <button type="button" onClick={this.forward.bind(this)} className="App-actionButton">
            {'Continue to Merging '}
            <Icon type="right" />
          </button>
        </div>
        <ActionMenu />
        <div className="MatchChoices-container">
          <div>
            <div className="MatchChoices-matchedChoices">
              <div className="MatchChoices-title">Matched Choices</div>
              <MatchedChoices removeChoiceMatch={removeChoiceMatch} tableData={matchedChoices} />
            </div>
            <div className="MatchChoices-unmatchedChoices">
              <div className="MatchChoices-title">Unmatched Choices</div>
              <ChoiceMatcher />
            </div>
            <div style={{ clear: 'both' }} />
          </div>
          <div className="MatchChoices-saveAndContinue">
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'save')}
              className="App-actionButton"
            >
              Save
            </button>
            <button
              type="button"
              onClick={this.saveChanges.bind(this, 'continue')}
              className="App-submitButton"
            >
              Save and Continue
            </button>
          </div>
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    );
  }
}

MatchChoices.propTypes = {
  fieldErrors: PropTypes.objectOf(PropTypes.any),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  ddData: PropTypes.arrayOf(PropTypes.object),
  projectInfo: PropTypes.objectOf(PropTypes.any),
  jsonData: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.object)),
  csvHeaders: PropTypes.objectOf(PropTypes.array),
  columnsInError: PropTypes.objectOf(PropTypes.array),
  rowsInError: PropTypes.objectOf(PropTypes.array),
  workingSheetName: PropTypes.string,
  workingColumn: PropTypes.string,
};

MatchChoices.defaultProps = {
  fieldErrors: {},
  dataFieldToChoiceMap: {},
  ddData: [],
  jsonData: [],
  projectInfo: {},
  csvHeaders: {},
  columnsInError: {},
  rowsInError: {},
  workingSheetName: '',
  workingColumn: '',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ resolveColumn, removeChoiceMatch, navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MatchChoices);
