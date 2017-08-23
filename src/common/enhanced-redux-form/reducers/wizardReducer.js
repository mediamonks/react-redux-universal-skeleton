import { createSelectorCreator, defaultMemoize } from 'reselect';
import { handleActionsAsync } from '../../util/asyncReducer';
import {
  REGISTER_WIZARD_FORM,
  WIZARD_STEP_SUBMIT,
  WIZARD_STEP_MOUNT,
  TRIGGER_WIZARD_FORM_SUBMIT,
  SUBMIT_WIZARD_FORM,
  DESTROY_WIZARD_FORM,
} from '../actions/wizardFormActions';

const initialWizardStepState = {
  submitted: false,
  form: null,
  submittedKeys: [],
};

const wizardFormStep = (state = initialWizardStepState, action, stepIndex) => {
  switch (action.type) {
    case REGISTER_WIZARD_FORM:
      return {
        ...state,
        path: action.payload.steps[stepIndex].path,
        hideInProgress: action.payload.steps[stepIndex].hideInProgress,
        stepIndex: action.payload.steps[stepIndex].stepIndex,
      };
    case WIZARD_STEP_MOUNT:
      return {
        ...state,
        form: action.meta.form,
      };
    case WIZARD_STEP_SUBMIT:
      return {
        ...state,
        submitted: true,
        submittedKeys: Object.keys(action.payload.formValues).reduce((keys, key) => {
          if (typeof action.payload.formValues[key] === 'object') {
            return keys.concat(
              Object.keys(action.payload.formValues[key]).map(subKey => `${key}.${subKey}`),
            );
          }
          keys.push(key);
          return keys;
        }, []),
      };
    default:
      return state;
  }
};

const initialWizardState = {
  steps: null,
  submittedValues: {},
  submitting: false,
  submitted: false,
  submitFailed: false,
  generalError: null,
  lastMountedStepIndex: -1,
};

const wizardForm = handleActionsAsync(
  {
    [WIZARD_STEP_MOUNT]: (state, action) => {
      const stepIndex = state.steps.findIndex(step => step.path === action.payload.routePath);

      return {
        ...state,
        steps: state.steps.map(
          (step, index) => (index === stepIndex ? wizardFormStep(step, action, stepIndex) : step),
        ),
        lastMountedStepIndex: stepIndex >= 0 ? stepIndex : state.lastMountedStepIndex,
      };
    },
    [REGISTER_WIZARD_FORM]: (state, action) => ({
      ...state,
      steps:
        state.steps ||
        action.payload.steps.map((step, stepIndex) => wizardFormStep(undefined, action, stepIndex)),
    }),
    [WIZARD_STEP_SUBMIT]: (state, action) => ({
      ...state,
      steps: state.steps.map((step, stepIndex) => {
        if (stepIndex === action.payload.stepIndex) {
          return wizardFormStep(step, action, stepIndex);
        }
        return step;
      }),
      submittedValues: {
        ...state.submittedValues,
        ...action.payload.formValues,
      },
    }),
    [TRIGGER_WIZARD_FORM_SUBMIT]: state => ({
      ...state,
      // the enhancedFormWizard component will respond to this change by calling the submit action
      submitting: true,
    }),
    [SUBMIT_WIZARD_FORM]: {
      pending: state => ({
        ...state,
        submitting: true,
      }),
      resolved: state => ({
        ...state,
        submitted: true,
        submitting: false,
        generalError: null,
        submitFailed: false,
      }),
      rejected: (state, { payload: error }) => ({
        ...state,
        submitted: true,
        submitting: false,
        submitFailed: true,
        generalError: (error && error.error && error.error.message) || null,
      }),
    },
  },
  initialWizardState,
);

const wizard = (state = {}, action) => {
  if (action.meta && action.meta.wizardName) {
    switch (action.type) {
      case REGISTER_WIZARD_FORM:
      case WIZARD_STEP_SUBMIT:
      case TRIGGER_WIZARD_FORM_SUBMIT:
      case SUBMIT_WIZARD_FORM:
      case WIZARD_STEP_MOUNT: {
        return {
          ...state,
          [action.meta.wizardName]: wizardForm(state[action.meta.wizardName], action),
        };
      }
      case DESTROY_WIZARD_FORM: {
        // eslint-disable-next-line no-unused-vars
        const { [action.meta.wizardName]: toRemove, ...newState } = state;
        return newState;
      }
      default:
        return state;
    }
  }

  return state;
};

const createStepPathsSelector = createSelectorCreator(
  defaultMemoize,
  (stepsA, stepsB) =>
    stepsA.length === stepsB.length &&
    stepsA.every((step, index) => step.path === stepsB[index].path),
);

export const createWizardStepPathsSelector = (wizardName, hideInProgress) =>
  createStepPathsSelector(
    state => (state[wizardName] ? state[wizardName].steps || [] : []),
    steps => steps.filter(step => !hideInProgress || !step.hideInProgress).map(step => step.path),
  );

export const createWizardStepsSelector = (wizardName, hideInProgress = false) =>
  createStepPathsSelector(
    state => (state[wizardName] ? state[wizardName].steps || [] : []),
    steps => steps.filter(step => !hideInProgress || !step.hideInProgress),
  );

export default wizard;
