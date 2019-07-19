import moment from 'moment';

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
