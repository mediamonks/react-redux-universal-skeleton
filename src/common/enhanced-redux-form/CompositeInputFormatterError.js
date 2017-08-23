/**
 * Custom error type that can be used in compositInputFormatters to indicate that one
 * of the values of the sub-fields is invalid.
 *
 * @class CompositeInputFormatterError
 * @param {object|string} fieldsOrMessage A string indicating a general error message, or a map
 * of error strings per field
 * @category forms
 */
export default class CompositeInputFormatterError extends Error {
  constructor(fieldsOrMessage) {
    super('Cannot format composite input');

    if (typeof fieldsOrMessage === 'string') {
      this.compositeError = fieldsOrMessage;
    } else if (typeof fieldsOrMessage === 'object') {
      this.invalidFields = fieldsOrMessage;
    }
  }
}
