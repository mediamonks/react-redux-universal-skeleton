import compositeInputFormatters from '../compositeInputFormatters';

/** @module enhanced-redux-form/utils/processCompositeInputs */

/**
 * Returns the number of occurrences of [query] in [str]
 *
 * @function count
 * @param {string} str The string to search in
 * @param {string|RegExp} query The query to count
 * @returns {number} The count
 * @private
 */
const count = (str, query) => (str.match(query) || []).length;

/**
 * __Note:  this function is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Helper function for getFormattedValues.
 *
 * @private
 * @function processCompositeInputs
 * @param formValues An object containing the form values as stored by redux-form
 * @param compositeInputs An object containing CompositeInput configuration as stored
 * in the redux state.
 * @returns {{values: Object, errors: Object}} An object containing 'values' with the
 * processed form values and 'errors' with any errors that occurred during formatting.
 * @category forms
 */
export default (formValues, compositeInputs) => {
  const values = { ...formValues };
  const errors = {};

  Object.keys(compositeInputs)
    .sort((a, b) => count(b, /\./g) - count(a, /\./g))
    .forEach(compositeName => {
      const { formatter } = compositeInputFormatters[compositeInputs[compositeName]];

      try {
        if (typeof values[compositeName] !== 'undefined') {
          if (!Object.keys(values[compositeName]).length) {
            delete values[compositeName];
          } else {
            values[compositeName] = formatter(values[compositeName]);
          }
        }
      } catch (e) {
        if (e.compositeError) {
          errors[compositeName] = e.compositeError;
        } else if (e.invalidFields) {
          Object.keys(e.invalidFields).forEach(subFieldName => {
            errors[`${compositeName}.${subFieldName}`] = e.invalidFields[subFieldName];
          });
        } else {
          throw e;
        }
      }
    });

  return { values, errors };
};
