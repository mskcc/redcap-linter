import React, { Component } from 'react';
import './ErrorsResolved.scss';

class ErrorsResolved extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    return (
      <div className="ErrorsResolved-introduction">
        <p>All errors are resolved!</p>
        <p>Please take the time now to ensure all column names are matched by navigating to the Match Fields screen.</p>
        <p>If all fields have been matched and all errors resolved you may now download your progress to prevent from having to resolve errors a second time.</p>
        <p>Please fill out the form below to generate an output file containing the records encoded and ready to upload to REDCap.</p>
      </div>
    );
  }
}

export default ErrorsResolved;
