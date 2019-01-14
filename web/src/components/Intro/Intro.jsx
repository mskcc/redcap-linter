import React, { Component } from 'react';
import './Intro.css';

class Intro extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    return (
      <div className="Intro-introduction">
        <p>Welcome to REDCap Linter!</p>
        <p>REDCap Linter is a visual tool to facilitate the process of preparing data for upload into REDCap. REDCap Linter helps by automatically finding errors in a datafile for a project and recommending corrections in column names and errors within fields.</p>
        <p>To get started enter either a project token and datafile to process or a Data-Dictionary and the list of repeatable instruments.</p>
        <p>If you do not have a token you can download the Data-Dictionary for a project by navigating to your project in REDCap, then navigate to Project Setup -> Data Dictionary -> Download the current Data Dictionary.</p>
      </div>
    );
  }
}

export default Intro;
