/** @module enhanced-redux-form/utils/isFieldRegistered */

/**
 * Returns true if the given fields is among the given collection of registeredFields
 * @function isFieldRegistered
 * @param {Array} registeredFields Array of registered fields. You can use `getRegisteredFields`
 * to obtain this
 * @param {string} fieldName Name of the field
 * @returns {object} The field instance if it's found, null otherwise
 * @category forms
 */
export default (registeredFields, fieldName) =>
  registeredFields.find(field => field.name === fieldName && field.count);
