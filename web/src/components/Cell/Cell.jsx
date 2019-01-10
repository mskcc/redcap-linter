import React, { Component } from 'react';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';

class Cell extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cellData: '',
    };
  }

  render() {
    const { cellData } = this.props;
    return (
      <div
        contentEditable
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
};

Cell.defaultProps = {
  cellData: '',
};

export default Cell;
