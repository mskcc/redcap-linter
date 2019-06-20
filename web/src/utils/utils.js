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
