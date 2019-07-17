import React, { Component } from 'react';
import './Linter.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import ResolveErrors from '../ResolveErrors/ResolveErrors';
import ResolveMergeConflicts from '../ResolveMergeConflicts/ResolveMergeConflicts';
import ErrorsResolved from '../ErrorsResolved/ErrorsResolved';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import Intro from '../Intro/Intro';
import Form from '../Form/Form';
import MatchFields from '../MatchFields/MatchFields';

class Linter extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      dataFieldToRedcapFieldMap,
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      mergeMap,
    } = nextProps;
    if (
      !_.isEmpty(dataFieldToRedcapFieldMap)
      || !_.isEmpty(dataFieldToChoiceMap)
      || !_.isEmpty(originalToCorrectedValueMap)
      || !_.isEmpty(mergeMap)
    ) {
      window.addEventListener('beforeunload', (event) => {
        event.returnValue = 'You have unsaved changes.';
      });
    }
  }

  componentWillUnmount() {
    const {
      dataFieldToRedcapFieldMap,
      dataFieldToChoiceMap,
      originalToCorrectedValueMap,
      mergeMap,
    } = this.props;
    if (
      !_.isEmpty(dataFieldToRedcapFieldMap)
      || !_.isEmpty(dataFieldToChoiceMap)
      || !_.isEmpty(originalToCorrectedValueMap)
      || !_.isEmpty(mergeMap)
    ) {
      window.removeEventListener('beforeunload', (event) => {
        event.returnValue = 'You have unsaved changes.';
      });
    }
  }

  render() {
    const { page } = this.props;
    let currentPage = '';
    console.log(this.props);
    if (page === 'intro') {
      currentPage = (
        <div className="Linter-container">
          <Form />
          <Intro />
        </div>
      );
    } else if (page === 'matchFields') {
      currentPage = <MatchFields />;
    } else if (page === 'lint') {
      currentPage = <ResolveErrors />;
    } else if (page === 'merge') {
      currentPage = <ResolveMergeConflicts />;
    } else if (page === 'finish') {
      currentPage = <ErrorsResolved />;
    }
    return (
      <div>
        <Breadcrumbs page={page} />
        {currentPage}
      </div>
    );
  }
}

Linter.propTypes = {
  page: PropTypes.string,
  dataFieldToRedcapFieldMap: PropTypes.objectOf(PropTypes.object),
  dataFieldToChoiceMap: PropTypes.objectOf(PropTypes.object),
  originalToCorrectedValueMap: PropTypes.objectOf(PropTypes.object),
  mergeMap: PropTypes.objectOf(PropTypes.object),
};

Linter.defaultProps = {
  page: 'intro',
  dataFieldToRedcapFieldMap: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
  mergeMap: {},
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Linter);
