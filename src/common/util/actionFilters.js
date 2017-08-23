/**
 * Returns a filter that returns true when the given `form` name is on the action's `meta`.
 * @param formName {string} Name of the form to filter for
 */
export const metaHasForm = formName => ({ meta }) => meta && meta.form === formName;

/**
 * Returns true if the given action has an `isAsync` and `isFulfilled` flag on `meta`
 * @param action {object} The action to check
 */
export const isFulfilled = ({ meta }) => meta && meta.isAsync && meta.isFulfilled;

/**
 * Returns a filter that checks if an action has the given validation error code on
 * its payload
 * @param errorCode {string} The error code to
 */
export const hasErrorCode = errorCode => ({ payload }) =>
  typeof payload.errors === 'object' &&
  Object.keys(payload.errors).some(
    errorField => payload.errors[errorField].code && payload.errors[errorField].code === errorCode,
  );
