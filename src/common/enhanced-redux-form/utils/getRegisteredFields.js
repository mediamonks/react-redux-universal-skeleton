/** @module enhanced-redux-form/utils/getRegisteredFields */

/**
 * Retrieves the registered fields from a redux form.
 * @function getRegisteredFields
 * @param {object} state The current redux state
 * @param {string} formName A name of a form
 * @returns {Array}
 * @category forms
 */
export default (state, formName) => {
  if (!state.form) {
    throw new Error('Redux form not set up in the rootReducer');
  }

  const formState = state.form[formName];

  let registeredFields = [];
  if (formState && formState.registeredFields) {
    registeredFields = Object.keys(formState.registeredFields).map(
      field => formState.registeredFields[field],
    );
  }

  return registeredFields;
};
