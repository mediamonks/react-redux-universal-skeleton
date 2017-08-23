import { actionTypes as formActionTypes } from 'redux-form';
import { debounce } from 'throttle-debounce';
import * as ValidateOn from './data/ValidateOn';
import {
  formShouldValidate,
  clearValidation,
  destroyEnhancedForm,
} from './actions/enhancedFormActions';
import { composeCompositeInputs } from './actions/compositeInputActions';
import { COMPOSITE_FORMSECTION_NAME_PREFIX } from './data/constants';

/** @module enhanced-redux-form/enhancedReduxFormMiddleware */

/**
 * Debounce delay for redux-form events
 */
const INPUT_ACTION_DEBOUNCE = 150;

/**
 * Delay for grouping blur/focus to detect composite blur/focus
 */
const FOCUS_BLUR_DELAY = 100;

/**
 * Map of ValidateOn event name per actionType
 */
const VALIDATION_EVENTS = Object.keys(ValidateOn).reduce((events, eventName) => {
  // eslint-disable-next-line no-param-reassign
  events[formActionTypes[eventName]] = eventName;
  return events;
}, {});

/**
 * Regular expression to match names of FieldSection instances that have been
 * created by CompositeInput. The name of the CompositeInput is available as
 * the first captured group
 * @type {RegExp}
 */
const COMPOSITE_FIELD_SECTION_NAME_REGEXP = new RegExp(
  `^${COMPOSITE_FORMSECTION_NAME_PREFIX}(.+)$`,
);

/**
 * Extracts all composite field names from the given field name
 * @private
 * @param fieldName
 * @returns {Array<string>} An array of composite input names without prefix
 */
const getCompositeInputNames = fieldName =>
  fieldName
    .split('.')
    .map(inputName => inputName.match(COMPOSITE_FIELD_SECTION_NAME_REGEXP))
    .filter(match => match)
    .map(match => match[1]);

/**
 * Returns the names of all composite inputs which are currently active (with focus)
 * on the given form.
 * @private
 */
const getActiveCompositeInputs = (formState, form) =>
  formState[form] && formState[form].active ? getCompositeInputNames(formState[form].active) : [];

/**
 * Form validation middleware that should be passed to redux when initializing the store. This
 * will intercept redux-form actions and perform enhanced functionality accordingly
 * @function enhancedReduxFormMiddleware
 * @param {object} params Parameters passed by redux middleware API
 * @returns {function} A redux middleware function
 * @category forms
 */
const enhancedReduxFormMiddleware = ({ getState, dispatch }) => {
  const eventBuffer = [];

  let beforeFocusState = null;
  const focusChangeComplete = () => {
    const newState = getState();
    Object.keys(newState.form)
      .filter(
        formName =>
          newState.form[formName].active !== (beforeFocusState.form[formName] || {}).active,
      )
      .forEach(form => {
        const wasActive = getActiveCompositeInputs(beforeFocusState.form, form);
        const isActive = getActiveCompositeInputs(newState.form, form);
        isActive
          .filter(name => !wasActive.includes(name))
          .forEach(name => eventBuffer.push({ form, field: name, event: 'FOCUS' }));
        wasActive
          .filter(name => !isActive.includes(name))
          .forEach(name => eventBuffer.push({ form, field: name, event: 'BLUR' }));
      });

    beforeFocusState = null;
  };
  const focusChangeStart = state => {
    if (!beforeFocusState) {
      beforeFocusState = state;
      setTimeout(focusChangeComplete, FOCUS_BLUR_DELAY);
    }
  };

  const scheduleHandleEvents = debounce(INPUT_ACTION_DEBOUNCE, () => {
    const actionsToExecute = {};
    const state = getState();

    eventBuffer.forEach(event => {
      const { field, form, event: eventName, time: eventTime } = event;
      const formValidationState = state.enhancedForm.validation[form];
      const compositeInputState = state.enhancedForm.compositeInput[form];

      if (!actionsToExecute[form]) {
        actionsToExecute[form] = {
          validate: new Set(),
          clearValidation: new Set(),
          compose: new Set(),
        };
      }

      if (formValidationState) {
        if (
          formValidationState.validateOn[eventName] &&
          formValidationState.validateOn[eventName].includes(field)
        ) {
          actionsToExecute[form].validate.add(field);
          actionsToExecute[form].compose.add(field);
        } else if (
          eventName === 'CHANGE' &&
          formValidationState.validated.includes(field) &&
          formValidationState.lastValidationTime[field] &&
          formValidationState.lastValidationTime[field] < eventTime
        ) {
          actionsToExecute[form].clearValidation.add(field);
        }
      }

      if (
        compositeInputState &&
        compositeInputState[field] &&
        compositeInputState[field].composeOn === eventName
      ) {
        actionsToExecute[form].compose.add(field);
      }
    });

    Object.keys(actionsToExecute).forEach(form => {
      if (actionsToExecute[form].compose.size) {
        dispatch(composeCompositeInputs(form, Array.from(actionsToExecute[form].compose)));
      }
      if (actionsToExecute[form].validate.size) {
        dispatch(formShouldValidate(form, Array.from(actionsToExecute[form].validate)));
      }
      if (actionsToExecute[form].clearValidation.size) {
        dispatch(clearValidation(form, Array.from(actionsToExecute[form].clearValidation)));
      }
    });

    eventBuffer.length = 0;
  });

  return next => action => {
    const { type } = action;
    if (type === formActionTypes.DESTROY) {
      dispatch(destroyEnhancedForm(action.meta.form));
      return next(action);
    }

    if (VALIDATION_EVENTS[type]) {
      const { form, field } = action.meta;
      const time = new Date().getTime();

      // push a regular event to the event buffer
      eventBuffer.push({ form, field, event: VALIDATION_EVENTS[type], time });

      const state = getState();

      const compositeInputState = state.enhancedForm.compositeInput[action.meta.form];
      if (compositeInputState) {
        if (type === formActionTypes.CHANGE) {
          getCompositeInputNames(action.meta.field).forEach(name =>
            eventBuffer.push({ form, field: name, event: 'CHANGE', time }),
          );
        }

        if (type === formActionTypes.BLUR || type === formActionTypes.FOCUS) {
          focusChangeStart(state);
        }
      }

      scheduleHandleEvents();
    }

    return next(action);
  };
};

export default enhancedReduxFormMiddleware;
