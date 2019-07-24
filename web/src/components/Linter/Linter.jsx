import React, { Component } from 'react';
import './Linter.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Modal } from 'antd';
import _ from 'lodash';
import ResolveErrors from '../ResolveErrors/ResolveErrors';
import ResolveMergeConflicts from '../ResolveMergeConflicts/ResolveMergeConflicts';
import ErrorsResolved from '../ErrorsResolved/ErrorsResolved';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import Intro from '../Intro/Intro';
import Form from '../Form/Form';
import MatchFields from '../MatchFields/MatchFields';
import { finishDownload, fetchConfig } from '../../actions/REDCapLinterActions';

class Linter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
    };

    this.onUnload = this.onUnload.bind(this);
    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  componentDidMount() {
    const { fetchConfig } = this.props;
    fetchConfig();
  }

  componentDidUpdate() {
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
      window.addEventListener('beforeunload', this.onUnload);
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

  onUnload(e) {
    const { formSubmitting, finishDownload } = this.props;
    if (formSubmitting) {
      finishDownload();
      return undefined;
    }
    e.preventDefault();
    this.setState({ showModal: true });
    e.returnValue = 'You have unsaved changes';
  }

  handleOk(e) {
    this.setState({
      showModal: false,
    });
  }

  handleCancel(e) {
    this.setState({
      showModal: false,
    });
  }

  // TODO Figure out if its possible to do custom Modal on unload
  // <Modal
  //   title="Basic Modal"
  //   visible={showModal}
  //   onOk={this.handleOk}
  //   onCancel={this.handleCancel}
  // >
  //   <p>Some contents...</p>
  //   <p>Some contents...</p>
  //   <p>Some contents...</p>
  // </Modal>

  render() {
    const { showModal } = this.state;
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
  formSubmitting: PropTypes.bool,
};

Linter.defaultProps = {
  page: 'intro',
  dataFieldToRedcapFieldMap: {},
  dataFieldToChoiceMap: {},
  originalToCorrectedValueMap: {},
  mergeMap: {},
  formSubmitting: false,
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ finishDownload, fetchConfig }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Linter);
