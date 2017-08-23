import { createAction } from 'redux-actions';

export const ADD_ERROR = 'errorActions/ADD_ERROR';
export const CLEAR_ERRORS = 'errorActions/CLEAR_ERRORS';

export const clearErrors = createAction(CLEAR_ERRORS);

/**
 *
 * @param {Error} error A JS error that happens and you want to display
 * @param {string} errorCode
 * @param {string} errorMessage
 * @param {string} type Can be used in the future to distinguish different type of errors
 */
export const addError = createAction(
  ADD_ERROR,
  ({ error, errorCode, errorMessage, statusCode, type }) => {
    const payload = {
      type,
      statusCode,
    };

    if (error) {
      payload.message = error.message || JSON.stringify(error);
      payload.stack = JSON.stringify(error.stack);
    } else {
      payload.code = errorCode;
      payload.message = errorMessage;
    }

    return payload;
  },
);
