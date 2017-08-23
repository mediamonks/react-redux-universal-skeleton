import { createAction } from 'redux-actions';
import { change as reduxFormChange } from 'redux-form';
import debugLib from 'debug';
import compositeInputFormatters from '../compositeInputFormatters';
import { COMPOSITE_FORMSECTION_NAME_PREFIX } from '../data/constants';

/**
 * All functions in this module are action creators and the return value
 * should be passed to the redux store dispatch() function
 *
 * @module enhanced-redux-form/actions/compositeInputActions
 * @category forms
 */

const debug = debugLib('React:compositeInputActions');

export const REGISTER_COMPOSITE_INPUT = 'compositeInputActions/REGISTER_COMPOSITE_INPUT';
export const UNREGISTER_COMPOSITE_INPUT = 'compositeInputActions/UNREGISTER_COMPOSITE_INPUT';
export const COMPOSITE_VALIDATION_ERRORS = 'compositeInputActions/COMPOSITE_VALIDATION_ERRORS';
export const COMPOSE_COMPOSITE_INPUT = 'compositeInputActions/COMPOSE_COMPOSITE_INPUT';

export const composeCompositeInput = createAction(
  COMPOSE_COMPOSITE_INPUT,
  (form, field, value) => ({ field, value }),
  form => ({ form }),
);

/**
 * Register a composite input mount
 *
 * @function registerCompositeInput
 * @param {string} form The id of the redux-form that the input is rendered in
 * @param {string} field The name to register the composite input under
 * @param {Object} formatter One of the formatters to use as defined in compositeInputFormatters.js
 * @param {string} composeOn A string indicating on which event the composite input should run
 * its formatter, besides running before each validation round
 * @returns {object} The action
 */
export const registerCompositeInput = createAction(
  REGISTER_COMPOSITE_INPUT,
  (form, field, formatter, composeOn = null) => ({ field, formatter: formatter.name, composeOn }),
  form => ({ form }),
);

/**
 * Register a composite input unmount
 *
 * @function unregisterCompositeInput
 * @param {string} form The id of the redux-form that the input was rendered in
 * @param {string} field The name of the composite input
 * @returns {object} The action
 */
export const unregisterCompositeInput = createAction(
  UNREGISTER_COMPOSITE_INPUT,
  (form, field) => ({ field }),
  form => ({ form }),
);

/**
 * Uses the decompose function in the compositeInputFormatter configuration to
 * decompose a single composite value back to values of the inputs and update
 * them accordingly. If no decompose function is configured, will ignore
 * this call.
 *
 * @param {string} form The id of the redux-form that the input was rendered in
 * @param {string} input The name of the composite input
 */
export const decomposeCompositeInput = (form, input) => (dispatch, getState) => {
  const { enhancedForm: { compositeInput }, form: formState } = getState();
  const compositeInputState = (compositeInput[form] && compositeInput[form][input]) || {};
  const composedValue = compositeInputState && compositeInputState.composedValue;
  const newValue = formState[form] && formState[form].values && formState[form].values[input];

  if (composedValue !== newValue) {
    debug(
      `decomposeCompositeInput() detected change (${form}.${input}: ${composedValue} => ${newValue}). `,
    );

    const { formatter } = compositeInputFormatters[compositeInputState.formatter];
    if (formatter && formatter.decompose) {
      const currentValues =
        (formState[form] &&
          formState[form].values &&
          formState[form].values[`${COMPOSITE_FORMSECTION_NAME_PREFIX}${input}`]) ||
        {};
      let decomposedValues;
      try {
        decomposedValues = formatter.decompose(newValue, currentValues);
      } catch (e) {
        debug(
          `Error while running decompose() in formatter "${compositeInputState.formatter}" for field "${input}" and value "${newValue}": ${e.message ||
            e}`,
        );
        debug('skipping update.');
        return;
      }
      if (typeof decomposedValues !== 'object') {
        debug(
          `Invalid return of decompose() in formatter "${compositeInputState.formatter}" for field "${input}" and value "${newValue}". Expected "object", got "${typeof decomposedValues}". skipping update.`,
        );
        return;
      }
      const compositeGroupName = `${COMPOSITE_FORMSECTION_NAME_PREFIX}${input}`;
      Object.keys(decomposedValues).forEach(fieldName => {
        const originalValue =
          formState[form] &&
          formState[form].values[compositeGroupName] &&
          formState[form].values[compositeGroupName][fieldName];
        if (originalValue !== decomposedValues[fieldName]) {
          dispatch(
            reduxFormChange(
              form,
              `${compositeGroupName}.${fieldName}`,
              decomposedValues[fieldName],
            ),
          );
        }
      });
    } else {
      debug('no decompose() config found on formatter. ignoring change');
    }
  } else {
    debug(
      `decomposeCompositeInput() ignored change (${form}.${input} => ${newValue}) because it equals the last value composed by composeCompositeInputs()`,
    );
  }
};

/**
 * Uses the formatter passed to CompositeInput components to format the inner values
 * of a CompositeInput to a composed value.
 *
 * @param {string} form The id of the redux-form that the input was rendered in
 * @param {Array<string>} [inputs] An array of inputs to compose. If omitted, will compose
 * all composite inputs on the form
 */
export const composeCompositeInputs = (form, inputs = null) => (dispatch, getState) => {
  const state = getState();
  const formState = state.form[form];

  if (!formState || !formState.values) {
    return;
  }

  const compositeInputs = state.enhancedForm.compositeInput[form] || {};
  const compositionErrors = {};
  const inputsToCompose = inputs || Object.keys(compositeInputs);
  const fieldHasError = {};

  inputsToCompose.forEach(fieldName => {
    if (!compositeInputs[fieldName]) {
      return;
    }

    const { formatter } = compositeInputFormatters[compositeInputs[fieldName].formatter];
    const formSectionName = `${COMPOSITE_FORMSECTION_NAME_PREFIX}${fieldName}`;
    fieldHasError[fieldName] = false;

    try {
      const childFieldValues = formState.values[formSectionName] || {};
      const value = formatter.compose(childFieldValues);
      if (formState.values[fieldName] !== value) {
        dispatch(composeCompositeInput(form, fieldName, value || ''));
        dispatch(reduxFormChange(form, fieldName, value || ''));
      }
    } catch (e) {
      if (e.compositeError) {
        compositionErrors[fieldName] = { message: e.compositeError };
        fieldHasError[fieldName] = true;
      } else if (e.invalidFields) {
        Object.keys(e.invalidFields).forEach(subFieldName => {
          compositionErrors[`${formSectionName}.${subFieldName}`] = {
            message: e.invalidFields[subFieldName],
          };
        });
        fieldHasError[fieldName] = true;
      } else {
        throw e;
      }
    }
  });

  if (Object.keys(fieldHasError).length) {
    dispatch({
      type: COMPOSITE_VALIDATION_ERRORS,
      payload: {
        errors: compositionErrors,
        fieldHasError,
      },
      meta: { form },
    });
  }
};
