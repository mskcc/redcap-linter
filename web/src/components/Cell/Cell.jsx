import React from 'react';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import './Cell.scss';

const Cell = (props, context) => {
  const { cellData, hasError } = props;
  let className = 'Cell-default';
  if (hasError) {
    className += ' Cell-error';
  }
  return <div className={className}>{cellData}</div>;
};

Cell.propTypes = {
  cellData: PropTypes.any,
  hasError: PropTypes.bool,
};

Cell.defaultProps = {
  cellData: '',
  hasError: false,
};

export default Cell;
