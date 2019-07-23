import React, { Component } from 'react';
import './ActionMenu.scss';
import '../../App.scss';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Menu, Icon, Button } from 'antd';
import ProjectInfo from '../ProjectInfo/ProjectInfo';
import { navigateTo } from '../../actions/REDCapLinterActions';

class ActionMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  goTo(page) {
    const { navigateTo } = this.props;
    navigateTo(page);
  }

  render() {
    const downloadButton = (
      <div>
        <ProjectInfo />
      </div>
    );

    return <div className="ActionMenu-column">{downloadButton}</div>;
  }
}

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ navigateTo }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ActionMenu);
