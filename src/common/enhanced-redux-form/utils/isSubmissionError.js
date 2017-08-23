/** @module enhanced-redux-form/utils/isSubmissionError */

/**
 * Tests if the given error is a submission error as returned by the Gateway API.
 *
 * @function isSubmissionError
 * @param error The error to check
 * @returns {boolean} A boolean indicating if the error is a submission error.
 * @category forms
 */
export default error => !!(error && error.error && (error.error.fields || error.error.message));
