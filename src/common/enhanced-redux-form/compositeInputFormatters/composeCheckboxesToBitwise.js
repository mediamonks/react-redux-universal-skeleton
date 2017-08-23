/**
 * Converts a list of checkboxes with names '0', '1', '2', etc... to a number value
 * representing the bitwise combination of all checkbox states.
 *
 * example:
 * `3 checked, 2 checked, 1 unchecked, 0 unchecked` will be converted to `1101`, so the number
 * output of the formatter will be `13`
 * @param {object} values The values of all the checkboxes
 * @returns {number}
 */
const composeCheckboxesToBitwise = values =>
  Object.keys(values).reduce((result, fieldName) => {
    if (values[fieldName]) {
      const numberIndex = typeof fieldName === 'number' ? fieldName : parseInt(fieldName, 10);
      return result | (1 << numberIndex); // eslint-disable-line no-bitwise
    }
    return result;
  }, 0);

export default composeCheckboxesToBitwise;
