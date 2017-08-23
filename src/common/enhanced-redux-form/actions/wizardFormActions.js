/* global WP_DEFINE_DEVELOPMENT */
import debugLib from 'debug';
import { createAction } from 'redux-actions';
import { destroy } from 'redux-form';
import isSubmissionError from '../utils/isSubmissionError';
import { HANDLE_SUBMIT_ERRORS } from './enhancedFormActions';

/**
 * All functions in this module are action creators and the return value
 * should be passed to the redux store dispatch() function
 *
 * @module enhanced-redux-form/actions/wizardFormActions
 * @category forms
 */

const debug = debugLib('React:wizardFormActions');

export const REGISTER_WIZARD_FORM = 'wizardFormActions/REGISTER_WIZARD_FORM';
export const DESTROY_WIZARD_FORM = 'wizardFormActions/DESTROY_WIZARD_FORM';
export const WIZARD_STEP_SUBMIT = 'wizardFormActions/WIZARD_STEP_SUBMIT';
export const WIZARD_STEP_MOUNT = 'wizardFormActions/WIZARD_STEP_MOUNT';
export const SUBMIT_WIZARD_FORM = 'wizardFormActions/SUBMIT_WIZARD_FORM';
export const TRIGGER_WIZARD_FORM_SUBMIT = 'wizardFormActions/TRIGGER_WIZARD_FORM_SUBMIT';

/* eslint-disable max-len */
/**
 * __Note: this action is dispatched by the enhancedFormWizard() HOC. You probable won't need to
 * call it yourself__
 *
 * Calls the given submit handler with the form values of the given wizard form. If submission
 * errors occur during submit, it will persist these errors on the relevant form step and redirect
 * to the first form step that contained any error.
 *
 * @function submitWizardForm
 * @param {string} wizardName The wizard name as passed to
 * the {@link module:enhanced-redux-form/enhancedFormWizard~enhancedFormWizard|enhancedFormWizard function}
 * @param {function} submitHandler The handler that should be called to perform the submit. The
 * handler will receive the following parameters:
 *  - **dispatch** The redux dispatch function
 *  - **values** An object containing all the values that have been submitted to individual form steps
 * @param {function} [transformApiFieldNames] A function that maps the field names in the validation
 * errors returned by the API to field names in the actual form.
 * @param {string} generalErrorMessage When the API call comes back with an error that doesn't
 * have the default error response shape, this message will be shown instead.
 * @param {function} historyPush A function that performs a history.push. If the wizard form
 * is mounted in QueryRouting, this can be a different history instance than the main
 * browserHistory
 */
/* eslint-enable max-leh */
export const submitWizardForm = (
  wizardName,
  submitHandler = () => {},
  transformApiFieldNames = name => name,
  generalErrorMessage,
  historyPush,
) => (dispatch, getState) => {
  const state = getState();
  const wizard = state.enhancedForm.wizard[wizardName];

  if (!wizard) {
    throw new ReferenceError(
      `Trying to submit wizard with name "${wizardName}" but it is not found in the Redux state.`,
    );
  }

  return dispatch({
    type: SUBMIT_WIZARD_FORM,
    payload: Promise.resolve(submitHandler(dispatch, wizard.submittedValues)).catch(submitError => {
      if (isSubmissionError(submitError)) {
        const errors = submitError.error.fields;
        const errorsPerStep = wizard.steps.map(() => []);

        errors.forEach(error => {
          const localFieldName = transformApiFieldNames(error.field);
          const stepWithErrorIndex = wizard.steps.findIndex(step =>
            step.submittedKeys.includes(localFieldName),
          );

          if (stepWithErrorIndex >= 0) {
            errorsPerStep[stepWithErrorIndex].push(error);
          } else {
            debug(
              `Submission errors contain a field with name '${error.field}' (transformed to '${localFieldName}') but the field is not found on any form step`,
            );
          }
        });

        errorsPerStep.forEach((stepErrors, stepIndex) => {
          if (stepErrors.length) {
            dispatch({
              type: HANDLE_SUBMIT_ERRORS,
              payload: {
                errors: stepErrors.reduce((errorObject, error) => {
                  // eslint-disable-next-line no-param-reassign
                  errorObject[transformApiFieldNames(error.field)] = { message: error.message };

                  return errorObject;
                }, {}),
              },
              meta: { form: wizard.steps[stepIndex].form },
            });
          }
        });

        const stepsWithError = wizard.steps.filter((step, index) => errorsPerStep[index].length);
        if (stepsWithError.length) {
          historyPush(stepsWithError[0].path);
        }
      } else if (generalErrorMessage) {
        // the wizardReducer will respond to the error format below
        // eslint-disable-next-line no-param-reassign
        submitError.error = { message: generalErrorMessage };
      }

      // don't silence the error. This will reject the SUBMIT_WIZARD_FORM async action
      throw submitError;
    }),
    meta: { wizardName },
  });
};

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Registers a new wizard form
 * @function registerWizardForm
 * @param {string} wizardName The name of the wizard
 * @param {Array<Object>} steps An array of steps in the wizard
 * @param {string} steps[].path The path of the route for this step
 * @returns {object} The action
 */
export const registerWizardForm = createAction(
  REGISTER_WIZARD_FORM,
  (wizardName, steps) => ({
    steps: steps.map(step => ({
      path: step.path,
      hideInProgress: !!step.wizardHideInProgress,
      stepIndex: step.wizardFormOrder,
    })),
  }),
  wizardName => ({ wizardName }),
);

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Registers a mount of a form that is part of a wizard.
 * @function wizardStepMount
 * @param {string} form The name of the form that is being mounted.
 * @param {string} wizardName The name of the wizard this form is part of.
 * @param {string} routePath The pathname of the route this form is rendered under.
 * @param {function} historyPush A function that performs a history.push. If the wizard form
 * is mounted in QueryRouting, this can be a different history instance than the main
 * browserHistory
 */
export const wizardStepMount = (form, wizardName, routePath, historyPush) => (
  dispatch,
  getState,
) => {
  const state = getState();
  const wizard = state.enhancedForm.wizard[wizardName];
  if (!wizard || !wizard.steps) {
    throw new ReferenceError(`Could not find wizard "${wizardName}" in wizard reducer`);
  }
  const steps = wizard.steps;

  const activeStepIndex = steps.findIndex(step => step.path === routePath);
  if (activeStepIndex < 0) {
    throw new ReferenceError(
      `Could not find step in wizard "${wizardName}" with path "${routePath}"`,
    );
  }

  let allowStepSkipping = false;
  if (WP_DEFINE_DEVELOPMENT) {
    allowStepSkipping =
      state.routing &&
      state.routing.locationBeforeTransitions &&
      state.routing.locationBeforeTransitions.query &&
      typeof state.routing.locationBeforeTransitions.query.allowWizardSkip !== 'undefined';
  }
  if (!allowStepSkipping) {
    for (let i = 0; i < activeStepIndex; i++) {
      const precedingStep = steps[i];
      if (!precedingStep.submitted) {
        historyPush(precedingStep.path);
        return null;
      }
    }
  }

  return dispatch({
    type: WIZARD_STEP_MOUNT,
    payload: { routePath },
    meta: { form, wizardName },
  });
};

export const destroyWizardForm = wizardName => (dispatch, getState) => {
  const state = getState();
  const wizard = state.enhancedForm.wizard[wizardName];
  if (!wizard || !wizard.steps) {
    debug(`Could not destroy wizard form "${wizardName}": wizard not found`);
    return;
  }
  const steps = wizard.steps;

  steps.forEach(step => {
    if (step.form) {
      dispatch(destroy(step.form));
    }
  });

  dispatch({
    type: DESTROY_WIZARD_FORM,
    meta: { wizardName },
  });
};

/**
 * __Note:  this action is used internally by enhanced-redux-form. You will probably not
 * need this for general usage__
 *
 * Handles when a form step submission has been completed
 * @function wizardStepSubmit
 * @param {string} wizardName The name of the wizard
 * @param {number} stepIndex Index of the step that has been submitted in the steps array
 * @param {Object} formValues The values submitted to the form
 * @param {function} historyPush A function that performs a history.push. If the wizard form
 * is mounted in QueryRouting, this can be a different history instance than the main
 * browserHistory
 */
export const wizardStepSubmit = (wizardName, stepIndex, formValues, historyPush) => (
  dispatch,
  getState,
) => {
  const state = getState();
  const wizard = state.enhancedForm.wizard[wizardName];
  if (!wizard || !wizard.steps) {
    throw new ReferenceError(`Could not find wizard "${wizardName}" in wizard reducer`);
  }
  const steps = wizard.steps;

  dispatch({
    type: WIZARD_STEP_SUBMIT,
    payload: { stepIndex, formValues },
    meta: { wizardName, form: steps[stepIndex].form },
  });

  const nextStep = steps[stepIndex + 1];
  if (nextStep) {
    historyPush(nextStep.path);
    return null;
  }

  // this action will set 'submitting' to 'true' in the Redux state. It will signal the wizard
  // component to call the 'submitWizardForm' action with the submit handler
  return dispatch({
    type: TRIGGER_WIZARD_FORM_SUBMIT,
    meta: { wizardName },
  });
};
