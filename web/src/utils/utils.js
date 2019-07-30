import moment from 'moment';
import _ from 'lodash';

export function _resolve(path, obj, separator = '.') {
  const properties = Array.isArray(path) ? path : path.split(separator);
  return properties.reduce((prev, curr) => prev && prev[curr], obj);
}

export function calculateSelectStyles(options) {
  const longestOption = options
    .map(option => option.value)
    .sort((a, b) => (a === null) - (b === null) || b.length - a.length)[0];
  let selectWidth = 200;
  if (longestOption) {
    selectWidth = 8 * longestOption.length + 60;
  }

  const selectStyles = {
    control: provided => ({
      ...provided,
    }),
    menu: provided => ({
      // none of react-select's styles are passed to <Control />
      ...provided,
      zIndex: 20,
      overflow: 'visible',
      minWidth: `${selectWidth}px`,
    }),
  };
  return selectStyles;
}

export function isValueValid(value, validation) {
  const { textValidation, textValidationMin, textValidationMax } = validation;

  let valid = true;
  if (textValidation === 'integer') {
    // https://stackoverflow.com/questions/1779013/check-if-string-contains-only-digits/1779019
    const integerRegex = /^[-+]?\d+$/;
    if (integerRegex.test(value)) {
      const parsedValue = parseInt(value, 10);
      if (
        (textValidationMin && parsedValue < parseInt(textValidationMin, 10))
        || (textValidationMax && parsedValue > parseInt(textValidationMax, 10))
      ) {
        valid = false;
      }
    } else {
      valid = false;
    }
  } else if (textValidation === 'number_2dp') {
    // https://stackoverflow.com/questions/1779013/check-if-string-contains-only-digits/1779019
    const decimalRegex = /^[-+]?\d+\.[0-9]{2}$/;
    if (decimalRegex.test(value)) {
      const parsedValue = parseFloat(value, 10);
      if (
        (textValidationMin && parsedValue < parseFloat(textValidationMin, 10))
        || (textValidationMax && parsedValue > parseFloat(textValidationMax, 10))
      ) {
        valid = false;
      }
    } else {
      valid = false;
    }
  } else if (textValidation === 'alpha_only') {
    const alphaOnlyRegex = /^[A-Za-z]+$/;
    if (!alphaOnlyRegex.test(value)) {
      valid = false;
    }
  }

  // TODO Add date validation

  return valid;
}

export function disabledDate(validation, current) {
  const { textValidationMin, textValidationMax } = validation;
  let disabled = false;
  if (
    (textValidationMin && current < moment(textValidationMin))
    || (textValidationMax && current > moment(textValidationMax))
  ) {
    disabled = true;
  }

  return disabled;
}

export function getNextColumn(columnsInError, workingSheetName, workingColumn) {
  let nextSheetName = '';
  let nextColumn = '';
  const allColumns = [];
  Object.keys(columnsInError).forEach((sheet) => {
    if (columnsInError[sheet] && columnsInError[sheet].length > 0) {
      columnsInError[sheet].forEach((column) => {
        allColumns.push([sheet, column]);
      });
    }
  });

  // Make sure this is not the last column
  if (allColumns.length > 0) {
    let nextColumnIndex = 0;
    const currColumnIndex = _.findIndex(
      allColumns,
      el => el[0] === workingSheetName && el[1] === workingColumn,
    );
    // Module wraps around to 0 if it reaches the end
    nextColumnIndex = (currColumnIndex + 1) % allColumns.length;
    nextSheetName = allColumns[nextColumnIndex][0];
    nextColumn = allColumns[nextColumnIndex][1];
  }

  if (workingSheetName === nextSheetName && workingColumn === nextColumn) {
    // Last column
    return {
      nextSheetName: '',
      nextColumn: '',
    };
  }

  return {
    nextSheetName,
    nextColumn,
  };
}

export function getNextRow(rowsInError, workingSheetName, workingRow) {
  let nextSheetName = '';
  let nextRow = -1;
  const allRows = [];
  Object.keys(rowsInError).forEach((sheet) => {
    if (rowsInError[sheet] && rowsInError[sheet].length > 0) {
      rowsInError[sheet].forEach((row) => {
        allRows.push([sheet, row]);
      });
    }
  });

  // Make sure this is not the last column
  if (allRows.length > 0) {
    let nextRowIndex = 0;
    const currRowIndex = _.findIndex(
      allRows,
      el => el[0] === workingSheetName && el[1] === workingRow,
    );
    // Module wraps around to 0 if it reaches the end
    nextRowIndex = (currRowIndex + 1) % allRows.length;
    nextSheetName = allRows[nextRowIndex][0];
    nextRow = allRows[nextRowIndex][1];
  }

  if (workingSheetName === nextSheetName && workingRow === nextRow) {
    // Last column
    return {
      nextSheetName: '',
      nextRow: -1,
    };
  }

  return {
    nextSheetName,
    nextRow,
  };
}

export function getNextMergeRow(mergeConflicts, workingSheetName, workingMergeRow) {
  let nextSheetName = '';
  let nextMergeRow = -1;
  const allRows = [];
  Object.keys(mergeConflicts).forEach((sheet) => {
    if (mergeConflicts[sheet] && Object.keys(mergeConflicts[sheet]).length > 0) {
      Object.keys(mergeConflicts[sheet]).forEach((row) => {
        allRows.push([sheet, row]);
      });
    }
  });

  // Make sure this is not the last column
  if (allRows.length > 0) {
    let nextRowIndex = 0;
    const currRowIndex = _.findIndex(
      allRows,
      el => el[0] === workingSheetName && el[1] === String(workingMergeRow),
    );
    // Module wraps around to 0 if it reaches the end
    nextRowIndex = (currRowIndex + 1) % allRows.length;

    nextSheetName = allRows[nextRowIndex][0];
    nextMergeRow = parseInt(allRows[nextRowIndex][1]);
  }

  if (workingSheetName === nextSheetName && workingMergeRow === nextMergeRow) {
    // Last column
    return {
      nextSheetName: '',
      nextMergeRow: -1,
    };
  }

  return {
    nextSheetName,
    nextMergeRow,
  };
}
