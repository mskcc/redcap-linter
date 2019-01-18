import React, { Component } from 'react';
import './Linter.scss';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ResolveErrors from '../ResolveErrors/ResolveErrors';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import Intro from '../Intro/Intro';
import MatchFields from '../MatchFields/MatchFields';
import { postForm } from '../../actions/RedcapLinterActions';

class Linter extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    const { page } = this.props;
    let currentPage = '';
    console.log(this.props);
    if (page === 'intro') {
      currentPage = <Intro />;
    } else if (page === 'matchFields') {
      currentPage = <MatchFields />;
    } else if (page === 'lint') {
      currentPage = <ResolveErrors />;
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
};

Linter.defaultProps = {
  page: 'intro',
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ submitForm: postForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Linter);
