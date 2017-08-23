/**
 * Decomposes the value composed by composeCheckboxesToArray().
 *
 * @see composeCheckboxesToArray
 * @param {string[]} values The combined bitwise value
 * @param {object} currentValues The current values of the checkboxes
 * @returns {object} An object containing individual values for checkboxes
 */
const decomposeCheckboxesToArray = (values, currentValues = {}) => {
  const newValues = {};

  // clear old values
  Object.keys(currentValues).forEach(key => {
    newValues[key] = values.includes(key) ? true : null;
  });
  // set new values
  values.forEach(key => {
    newValues[key] = true;
  });

  return newValues;
};

export default decomposeCheckboxesToArray;
