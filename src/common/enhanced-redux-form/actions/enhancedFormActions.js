/* global WP_DEFINE_DEVELOPMENT */
import debugLib from 'debug';
import { createAction } from 'redux-actions';
import { startSubmit as reduxFormStartSubmit, stopSubmit as reduxFormStopSubmit } from 'redux-form';
import { wizardStepSubmit } from './wizardFormActions';
import isSubmissionError from '../utils/isSubmissionError';
import getRegisteredFields from '../utils/getRegisteredFields';
import isFieldRegistered from '../utils/isFieldRegistered';
import { composeCompositeInputs } from './compositeInputActions';
import { COMPOSITE_FORMSECTION_NAME_PREFIX } from '../data/constants';

/**
 * All functions in this module are action creators and the return value
 * should be passed to the redux store dispatch() function
 *
 * @module enhanced-redux-form/actions/enhancedFormActions
 * @category forms
 */

const debug = debugLib('React:enhancedFormActions');

export const VALIDATE_FORM = 'enhancedFormActions/VALIDATE_FORM';
export const REGISTER_FORM = 'enhancedFormActions/REGISTER_FORM';
export const DESTROY_ENHANCED_FORM = 'enhancedFormActions/DESTROY_ENHANCED_FORM';
export const FORM_SHOULD_VALIDATE = 'enhancedFormActions/FORM_SHOULD_VALIDATE';
export const CLEAR_VALIDATION = 'enhancedFormActions/CLEAR_VALIDATION';
export const HANDLE_SUBMIT_ERRORS = 'enhancedFormActions/HANDLE_SUBMIT_ERRORS';
export const SUBMIT = 'enhancedFormActions/SUBMIT';

/**
 * Validate the given form and call submitHandler when the validation succeeds
 * @function submitForm
 * @param form The name of the form to submit
 * @param validation The validation configuration object as passed to the enhancedReduxForm
 * HOC. See validateForm() for more info
 * @param [formProps] The props that were passed to the form component that is being submitted.
 * Will be passed on to the onSubmit handler.
 * @param submitHandler The function to call when validation succeeds.
 * @param {function} [transformApiFieldNames] A function that maps the field names in the validation
 * errors returned by the API to field names in the actual form.
 * @param {function} [submitSuccessHandler] A callback that will be called when the submitHandler
 * function executes without error
 * @param {function} [submitFailHandler] A callback that will be called when there is a validation
 * error or an error in execution of submitHandler
 * @param {string} [generalErrorMessage] When the API call comes back with an error that doesn't
 * have the default error response shape, this message will be shown instead.
 * @param {function} historyPush A function that performs a history.push. If the form
 * is mounted in QueryRouting, this can be a different history instance than the main
 * browserHistory
 * @returns {function} Function that will be handled by redux-thunk
 */
export const submitForm = (
  form,
  validation,
  formProps = {},
  submitHandler = () => {},
  transformApiFieldNames,
  submitSuccessHandler,
  submitFailHandler,
  generalErrorMessage,
  historyPush,
) => (dispatch, getState) => {
  dispatch(composeCompositeInputs(form));

  return dispatch({
    type: SUBMIT,
    payload: dispatch(validateForm(validation, form)).then(() => {
      const state = getState();
      const formState = state.form[form];
      const registeredFields = getRegisteredFields(state, form);
      const { errors } = state.enhancedForm.validation[form];
      const noErrors = !Object.keys(errors).some(fieldName =>
        isFieldRegistered(registeredFields, fieldName),
      );

      if (noErrors) {
        dispatch(reduxFormStartSubmit(form));

        const values = {};
        if (formState && formState.values) {
          const prefix = COMPOSITE_FORMSECTION_NAME_PREFIX;
          Object.keys(formState.values).filter(name => !name.startsWith(prefix)).forEach(name => {
            values[name] = formState.values[name];
          });
        }
        return Promise.resolve()
          .then(() => submitHandler(values, dispatch, formProps))
          .then(result => {
            dispatch(reduxFormStopSubmit(form, {}));

            const wizard = findWizardWithForm(state, form);
            if (wizard) {
              return dispatch(
                wizardStepSubmit(wizard.wizardName, wizard.stepIndex, values, historyPush),
              );
            }

            submitSuccessHandler && submitSuccessHandler(result, dispatch, formProps);

            return result;
          })
          .catch(error => {
            // add a dummy error to indicate to redux-form that this was a failed submission
            dispatch(reduxFormStopSubmit(form, { _error: 'failed' }));

            submitFailHandler && submitFailHandler(errors, dispatch, null, formProps);

            if (isSubmissionError(error)) {
              return dispatch(handleSubmitErrors(form, error.error, transformApiFieldNames));
            }

            if (generalErrorMessage) {
              dispatch(
                handleSubmitErrors(form, {
                  message: generalErrorMessage,
                }),
              );
            }
            throw error;
          });
      }

      return null;
    }),
  });
};

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Handles submission errors that are thrown during form submission.
 * On development, verifies that the fields on the given errors array exist on the
 * form.
 *
 * @function handleSubmitErrors
 * @param {string} form The form that is being submitted
 * @param {Object} errorObj An object containing an error response from the backend API
 * @param {string} [errorObj.message] A general error message
 * @param {Array} [errorObj.fields] An array of submission errors per field
 * @param {string} errorObj.fields[].field The name of the field that the error occurred on
 * @param {string} errorObj.fields[].message The error message for the field
 * @param {function} [transformApiFieldNames] A function that maps the field names in the validation
 * errors returned by the API to field names in the actual form.
 * @returns {function} Function that will be handled by redux-thunk
 */
export const handleSubmitErrors = (form, errorObj, transformApiFieldNames = name => name) => (
  dispatch,
  getState,
) => {
  const { form: { [form]: formState = {} } } = getState();
  const fieldErrors = errorObj.fields || [];
  const fieldErrorsObj = fieldErrors
    .filter(error => error.field && error.message)
    .reduce((result, error) => {
      const localFieldName = transformApiFieldNames(error.field);

      // eslint-disable-next-line no-param-reassign
      result[localFieldName] = { message: error.message };
      return result;
    }, {});

  if (WP_DEFINE_DEVELOPMENT) {
    // on development, verify that all fields on the error object actually exist
    const registeredFields = Object.keys(formState.fields || {});
    fieldErrors.forEach(error => {
      const localFieldName = transformApiFieldNames(error.field);

      if (error.field && !registeredFields.includes(localFieldName)) {
        debug(
          `Submission errors contain a field with name '${error.field}' (transformed to '${localFieldName}') that does not exist in the form "${form}"`,
        );
      }
    });
  }

  dispatch({
    type: HANDLE_SUBMIT_ERRORS,
    payload: {
      errors: fieldErrorsObj,
      generalError: errorObj.message ? errorObj.message : null,
    },
    meta: { form },
  });
};

/**
 * Runs validation on the given form
 * @function validateForm
 * @param {Object<string, ValidationConfig>} validation The validation configuration object.
 * The keys of this object correspond to names of fields in the form, and the values are the
 * corresponding validation.
 * @param {string} form The name of the form to validate
 * @param {Array<string>} [fields] An array of field names to validate. If omitted, runs
 * validation on all fields
 * @returns {function} Function that will be handled by redux-thunk
 */
export const validateForm = (validation, form, fields) => (dispatch, getState) => {
  const state = getState();
  const formState = state.form[form];
  const validationState = state.enhancedForm.validation[form];
  const formValues = (formState && formState.values) || {};
  const registeredFields = getRegisteredFields(state, form);
  const validationErrors = {};

  const fieldsToValidate = fields && fields.length ? fields : Object.keys(validation);
  const validatedFields = fieldsToValidate.filter(
    fieldName =>
      !(validationState && validationState.hasCompositeError.includes(fieldName)) &&
      isFieldRegistered(registeredFields, fieldName),
  );
  // We attach the start time of validation to the action. This is to prevent race conditions
  // when overwriting new validation results with older validation calls
  const validationStartTime = new Date().getTime();

  const validationPromises = validatedFields.map(fieldName => {
    if (!validation[fieldName]) {
      debug(`no validation defined for fields "${fieldName}" on "${form}"`);
      return Promise.resolve();
    }

    const fieldValidators = validation[fieldName].validators;
    // we use reduce here because the rules need to execute in sequence
    return fieldValidators.reduce((prevValidation, fieldValidator) => {
      if (WP_DEFINE_DEVELOPMENT) {
        if (
          typeof fieldValidator.message === 'undefined' &&
          typeof fieldValidator.code === 'undefined'
        ) {
          throw new ReferenceError(
            `A validation rule should have either an error message or an error code. Check the "${fieldName}" validation of the "${form}" form`,
          );
        }
      }

      // callback that adds an error message to the error object if a result is falsy
      const processResult = result => {
        if (!result) {
          validationErrors[fieldName] = {
            message: fieldValidator.message,
            code: fieldValidator.code,
          };
        }
        return result;
      };

      if (prevValidation === null) {
        // there is no previous validation rule. run the first rule
        return Promise.resolve(
          fieldValidator.rule(
            extractFormValue(formValues, fieldName),
            formValues,
            fieldName,
            dispatch,
          ),
        ).then(processResult);
      }

      // there is a previous validation rule. wait for it to complete
      return prevValidation.then(isValid => {
        // if the previous validation resulted falsy, skip future rules
        if (!isValid) {
          return false;
        }

        return Promise.resolve(
          fieldValidator.rule(
            extractFormValue(formValues, fieldName),
            formValues,
            fieldName,
            dispatch,
          ),
        ).then(processResult);
      });
    }, null);
  });

  return dispatch({
    type: VALIDATE_FORM,
    payload: Promise.all(validationPromises).then(() => ({
      errors: validationErrors,
    })),
    meta: {
      // Data on meta rather than payload, to make it available when promise is still pending
      form,
      fields: [...validatedFields],
      startTime: validationStartTime,
    },
  });
};

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Registers mounting of a form with validation. This registration is used by the
 * enhancedReduxFormMiddleware to listen for events configured in the validation config object
 * and trigger validation if neccessary
 * @function registerForm
 * @param {string} form The name of the form
 * @param {Object<string, ValidationConfig>} validation The validation configuration object.
 * The keys of this object correspond to names of fields in the form, and the values are the
 * corresponding validation.
 * @param {string} [wizardName=null] The name of the enhancedFormWizard this form is part of
 * @param {string} [routePath=null] The pathname of the route this form is rendered under.
 * Only required when a wizardName is provided
 * @returns {function} Function that will be handled by redux-thunk
 */
export const registerForm = createAction(
  REGISTER_FORM,
  (form, validation) => {
    const validationFields = Object.keys(validation);

    // will reduce to form: { [eventName]: [fieldName1, fieldName2, ...] }
    const validateOn = validationFields.reduce((_validateOn, fieldName) => {
      /* eslint-disable no-param-reassign */
      if (validation[fieldName].validateOn) {
        [].concat(validation[fieldName].validateOn).forEach(eventName => {
          if (!_validateOn[eventName]) {
            _validateOn[eventName] = [];
          }
          _validateOn[eventName].push(fieldName);
        });
      }
      /* eslint-enable */

      return _validateOn;
    }, {});

    return { validateOn };
  },
  (form, _, wizardName) => ({ form, wizardName }),
);

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Called by enhancedReduxFormMiddleware whenever the destroy() action of redux-form is called.
 * Will cause the attached enhanced state to be destroyed as well
 * @function destroyEnhancedForm
 * @param {string} name The name of the form that is being unmounted
 * @returns {object} The action
 */
export const destroyEnhancedForm = createAction(
  DESTROY_ENHANCED_FORM,
  () => ({}),
  form => ({ form }),
);

/**
 * Removes validation from the form on the specified fields
 * @function clearValidation
 * @param {string} form The name of the form
 * @param {Array<string>} [fields] The fields to remove validation from. If not
 * specified, removes from all fields
 * @returns {object} The action
 */
export const clearValidation = createAction(
  CLEAR_VALIDATION,
  (form, fields) => ({
    fields,
  }),
  form => ({ form }),
);

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Called by the enhancedReduxFormMiddleware to indicate that certain fields of a form
 * should be validated. This state is picked up by the decorated form to trigger validation.
 * @function formShouldValidate
 * @param {string} form The name of the form
 * @param {Array<string>} fields An array of fields that should be validated.
 * @returns {object} The action
 */
export const formShouldValidate = createAction(
  FORM_SHOULD_VALIDATE,
  (form, fields) => ({
    fields,
  }),
  form => ({ form }),
);

function findWizardWithForm(state, form) {
  const wizardState = state.enhancedForm.wizard;
  const wizardNames = Object.keys(wizardState);

  for (let i = 0; i < wizardNames.length; i++) {
    const stepIndex = wizardState[wizardNames[i]].steps.findIndex(step => step.form === form);
    if (stepIndex >= 0) {
      return {
        stepIndex,
        wizardName: wizardNames[i],
      };
    }
  }

  return null;
}

/**
 * Extracts the given field from the given form values. If the field name is separated
 * by dots, do a deep lookup in the form values.
 * @param {object} formValues Object containing all form values
 * @param  {string} fieldName Name of field to retrieve
 * @returns The value or undefined if it is not found
 */
function extractFormValue(formValues, fieldName) {
  const parts = fieldName.split('.');
  if (parts.length < 2) {
    return formValues[fieldName];
  }
  return parts.reduce((subValues, part) => {
    if (typeof subValues === 'undefined' || subValues === null) {
      return subValues;
    }
    return subValues[part];
  }, formValues);
}

/**
 * @typedef ValidationRule
 * @property {function} rule A function that returns true or false for valid or invalid. May
 * also return a promise that resolves with true or false. It will receive the following arguments:
 *  - value The current value of the field
 *  - values An object containing all the values in the form
 *  - name The name of the field that is being validated
 *  - dispatch The redux store dispatch() method
 * @property {string} message A message that should be set as error message when
 * this field is invalid.
 */

/**
 * @typedef ValidationConfig
 * @type {object}
 * @property {string|Array<string>} [validateOn] A string or array of strings that specifies
 * on which event the validation should trigger. See ValidateOn.js for possible values.
 * @property {Array<ValidationRule>} validators An array of validation rules to test this
 * field for.
 */
