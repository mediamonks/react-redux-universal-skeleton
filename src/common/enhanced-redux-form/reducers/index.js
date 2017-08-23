import { combineReducers } from 'redux';
import { createSelector } from 'reselect';
import validation from './validationReducer';
import wizard from './wizardReducer';
import compositeInput from './compositeInputReducer';

export default combineReducers({
  validation,
  compositeInput,
  wizard,
});

const getFormGeneralError = (state, props) =>
  state.validation[props.form] ? state.validation[props.form].generalError : null;

const getWizardGeneralError = (state, props) => {
  const wizardName = Object.keys(state.wizard).find(wizardKey =>
    state.wizard[wizardKey].steps.some(step => step.form === props.form),
  );

  if (wizardName) {
    return state.wizard[wizardName].generalError;
  }
  return null;
};

export const makeGetGeneralFormError = () =>
  createSelector(
    [getFormGeneralError, getWizardGeneralError],
    (formGeneralError, wizardGeneralError) => formGeneralError || wizardGeneralError,
  );
