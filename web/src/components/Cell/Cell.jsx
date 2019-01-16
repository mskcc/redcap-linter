import React, { Component } from 'react';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import './Cell.css'

class Cell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cellData: '',
    };
  }

  render() {
    const {
      cellData,
      hasError,
      editable
    } = this.props;
    let className = 'Cell-default'
    if (hasError) {
      className += ' Cell-error';
    }
    return (
      <div
        className={className}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => {
          this.setState({ cellData: e.target.innerHTML });
        }}
      >
        {cellData}
      </div>
    );
  }
}

Cell.propTypes = {
  cellData: PropTypes.any,
  hasError: PropTypes.bool,
  editable: PropTypes.bool,
};

Cell.defaultProps = {
  cellData: '',
  hasError: false,
  editable: false,
};

export default Cell;
