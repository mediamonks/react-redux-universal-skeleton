import { createSelector } from 'reselect';
import { handleActionsAsync } from '../../util/asyncReducer';
import {
  VALIDATE_FORM,
  REGISTER_FORM,
  DESTROY_ENHANCED_FORM,
  FORM_SHOULD_VALIDATE,
  CLEAR_VALIDATION,
  HANDLE_SUBMIT_ERRORS,
} from '../actions/enhancedFormActions';
import { COMPOSITE_VALIDATION_ERRORS } from '../actions/compositeInputActions';
import { COMPOSITE_FORMSECTION_NAME_PREFIX } from '../data/constants';

const initialFormState = {
  shouldValidate: [],
  errors: {},
  hasCompositeError: [],
  validated: [],
  lastValidationTime: {},
  generalError: null,
};

const formValidationForm = handleActionsAsync(
  {
    [VALIDATE_FORM]: {
      pending: (state, action) => {
        // create an object that has a { [fieldName]: startTime } key for each validating field
        const validationTimes = {};
        action.meta.fields.forEach(field => {
          validationTimes[field] = action.meta.startTime;
        });

        return {
          ...state,
          shouldValidate: [],
          lastValidationTime: {
            ...state.lastValidationTime,
            ...validationTimes,
          },
        };
      },
      resolved: (state, action) => {
        const newErrors = { ...state.errors };
        const newValidated = [...state.validated];

        action.meta.fields
          // we filter out fields that have newer validation started
          .filter(field => state.lastValidationTime[field] === action.meta.startTime)
          .forEach(fieldName => {
            if (action.payload.errors[fieldName]) {
              newErrors[fieldName] = action.payload.errors[fieldName];
            } else {
              // delete errors for all children of the field
              Object.keys(newErrors)
                .filter(errorFieldName => errorFieldName.startsWith(fieldName))
                .forEach(errorFieldName => {
                  delete newErrors[errorFieldName];
                });
            }

            if (!newValidated.includes(fieldName)) {
              newValidated.push(fieldName);
            }
          });

        return {
          ...state,
          errors: newErrors,
          validated: newValidated,
        };
      },
    },
    [HANDLE_SUBMIT_ERRORS]: (state, action) => ({
      ...state,
      errors: action.payload.errors,
      validated: Object.keys(action.payload.errors),
      generalError: action.payload.generalError,
    }),
    [COMPOSITE_VALIDATION_ERRORS]: (state, action) => {
      const compositeFields = Object.keys(action.payload.fieldHasError);
      const errorFields = Object.keys(action.payload.errors);

      // clear previous composite errors
      const newErrors = { ...state.errors };
      Object.keys(newErrors).forEach(field => {
        if (
          compositeFields.some(compositeName =>
            field.startsWith(`${COMPOSITE_FORMSECTION_NAME_PREFIX}${compositeName}`),
          )
        ) {
          delete newErrors[field];
        }
      });

      // set lastValidationTime to current time
      const validationTime = new Date().getTime();
      const newLastValidationTime = { ...state.lastValidationTime };
      compositeFields.concat(errorFields).forEach(fieldName => {
        newLastValidationTime[fieldName] = validationTime;
      });

      return {
        ...state,
        errors: {
          ...newErrors,
          ...action.payload.errors,
        },
        validated: [
          ...state.validated,
          ...errorFields.filter(field => !state.validated.includes(field)),
        ],
        lastValidationTime: newLastValidationTime,
        hasCompositeError: state.hasCompositeError
          .filter(field => action.payload.fieldHasError[field] !== false)
          .concat(
            compositeFields.filter(
              field =>
                action.payload.fieldHasError[field] && !state.hasCompositeError.includes(field),
            ),
          ),
      };
    },
    [CLEAR_VALIDATION]: (state, action) => {
      const errors = {};
      let validated = [];

      if (action.payload.fields) {
        Object.keys(state.errors).forEach(field => {
          if (!action.payload.fields.includes(field)) {
            errors[field] = state.errors[field];
          }
        });
        validated = state.validated.filter(field => !action.payload.fields.includes(field));
      }

      return {
        ...state,
        validated,
        errors,
      };
    },
    [REGISTER_FORM]: (state, action) => ({
      ...state,
      validateOn: action.payload.validateOn,
    }),
    [FORM_SHOULD_VALIDATE]: (state, { payload: { fields } }) => ({
      ...state,
      shouldValidate: [...fields],
    }),
  },
  initialFormState,
);

const formValidation = (state = {}, action) => {
  switch (action.type) {
    case REGISTER_FORM:
    case FORM_SHOULD_VALIDATE:
    case CLEAR_VALIDATION:
    case HANDLE_SUBMIT_ERRORS:
    case COMPOSITE_VALIDATION_ERRORS:
    case VALIDATE_FORM: {
      return {
        ...state,
        [action.meta.form]: formValidationForm(state[action.meta.form], action),
      };
    }
    case DESTROY_ENHANCED_FORM: {
      // eslint-disable-next-line no-unused-vars
      const { [action.meta.form]: toRemove, ...newState } = state;
      return newState;
    }
    default:
      return state;
  }
};

const getFormErrorState = (state, props) => {
  const formState = state[props.form];
  return formState ? formState.errors : {};
};

const getFormValidatedState = (state, props) => {
  const formState = state[props.form];
  return formState ? formState.validated : [];
};

const getNameProp = (state, props) => props.input.name;

const getFieldsProp = (state, props) => props.fields;

export const makeGetErrorsForFields = () =>
  createSelector(
    [getFormErrorState, getFormValidatedState, getFieldsProp],
    (errors, validatedFields, fields) =>
      validatedFields
        .filter(
          validatedField =>
            (fields.includes(validatedField) ||
              fields.some(field =>
                validatedField.startsWith(`${COMPOSITE_FORMSECTION_NAME_PREFIX}${field}`),
              ) ||
              fields.some(field => validatedField.startsWith(`${field}.`))) &&
            errors[validatedField],
        )
        .map(field => ({ field, message: errors[field].message, code: errors[field].code })),
  );

export const makeGetCustomValidationMeta = () =>
  createSelector(
    [getFormErrorState, getFormValidatedState, getNameProp],
    (errors, validatedFields, name) => {
      const validated = validatedFields.includes(name);

      return {
        meta: {
          invalid: validated && !!errors[name],
          valid: validated && !errors[name],
          error: validated ? errors[name] || null : null,
          validated,
        },
      };
    },
  );

export const makeGetCombinedValidationStatus = () =>
  createSelector(
    [getFormErrorState, getFormValidatedState, getFieldsProp],
    (errors, validatedFields, fields) => ({
      validated: fields.every(field => validatedFields.includes(field)),
      hasError: fields.some(field => errors[field]),
    }),
  );

export default formValidation;
