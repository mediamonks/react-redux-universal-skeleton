/**
 * Converts a list of checkboxes with names '0', '1', '2', etc... to an array
 * containing all the keys that are checked.
 *
 * example:
 * `3 checked, 2 checked, 1 unchecked, 0 unchecked` will be converted to `[3, 2]`
 * @param {object} values The values of all the checkboxes
 * @returns {array}
 */
const composeCheckboxesToArray = values =>
  Object.keys(values).reduce((result, fieldName) => {
    if (values[fieldName]) {
      result.push(fieldName);
    }
    return result;
  }, []);

export default composeCheckboxesToArray;
