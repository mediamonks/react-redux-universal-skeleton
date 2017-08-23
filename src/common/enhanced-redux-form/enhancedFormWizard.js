/* global WP_DEFINE_DEVELOPMENT */
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { push as historyPush } from 'react-router-redux';
import {
  registerWizardForm,
  submitWizardForm,
  destroyWizardForm,
} from './actions/wizardFormActions';
import isSubmissionError from './utils/isSubmissionError';
import { createWizardStepsSelector, createWizardStepPathsSelector } from './reducers/wizardReducer';

/** @module enhanced-redux-form/enhancedFormWizard */

/**
 * Adds multi-step form functionality to a component. For general usage instructions, please refer
 * to {@tutorial enhanced-redux-form-wizard}.
 * @function enhancedFormWizard
 * @tutorial enhanced-redux-form-wizard
 * @param {object} wizardFormConfig Configuration object for the wizard
 * @param {string} wizardFormConfig.name A unique name for this wizard
 * @param {function} wizardFormConfig.onSubmit A submit handler that will be called after the last
 * form step has been submitted. It will receive the following parameters:
 *  * __dispatch__ The redux dispatch function
 *  * __values__ An object containing the submitted form values of all form steps
 * @param {boolean} [wizardFormConfig.destroyOnUnmount] If false, will not destroy the wizard form
 * state when this component is unmounted. Defaults to true
 * @param {string} [wizardFormConfig.generalErrorMessage] When the API call comes back with an
 * error that doesn't have the default error response shape, this message will be shown instead.
 * @param {string} [wizardFormConfig.transformApiFieldNames] A function that maps each field
 * name in an API validation response to a field name in this form. Can be used to map flattened
 * field names in the API back to nested names in redux-form.
 * @returns {function} A function that wraps a component in the wizard functionality
 * @example export default enhancedFormWizard({
 *   name: 'onlineRegistration',
 *   onSubmit: (dispatch, values) => { ... },
 * })(OnlineRegistration);
 * @category forms
 */
const enhancedFormWizard = wizardFormConfig => WrappedComponent => {
  if (WP_DEFINE_DEVELOPMENT) {
    // validation of the wizardFormConfig object
    if (typeof wizardFormConfig !== 'object') {
      throw new TypeError(
        `Unexpected argument type of "${typeof wizardFormConfig} passed to enhancedFormWizard"`,
      );
    }
    if (typeof wizardFormConfig.name === 'undefined') {
      throw new ReferenceError(
        'Expected enhancedFormWizard configuration object to contain a "name" property',
      );
    }
  }

  class EnhancedFormWizard extends Component {
    getChildContext() {
      return {
        enhancedFormWizard: {
          name: wizardFormConfig.name,
        },
      };
    }

    componentWillMount() {
      const wizardRoute = this.props.routes.find(route => route.isWizardForm);

      if (!wizardRoute) {
        throw new Error('Could not find wizard form in routes configuration.');
      }
      this.stepRoutes = (wizardRoute.childRoutes || [])
        .filter(route => typeof route.wizardFormOrder === 'number')
        .sort((a, b) => a.wizardFormOrder - b.wizardFormOrder);

      this.props.registerWizardForm(this.stepRoutes);
    }

    componentWillReceiveProps(props) {
      // changing the 'submitting' state to true indicates to this component it should submit
      if (!this.props.submitting && props.submitting) {
        const onSubmit = this.props.onSubmit || wizardFormConfig.onSubmit || (() => {});
        this.props.submitWizardForm(onSubmit).catch(error => {
          // swallow submission errors. they are pushed to the redux state
          if (!isSubmissionError(error)) {
            throw error;
          }
        });
      }
    }

    componentWillUnmount() {
      if (
        typeof wizardFormConfig.destroyOnUnmount === 'undefined' ||
        wizardFormConfig.destroyOnUnmount
      ) {
        this.props.destroyWizardForm();
      }
    }

    stepRoutes = null;

    render() {
      return <WrappedComponent {...this.props} />;
    }
  }

  EnhancedFormWizard.displayName = `enhancedFormWizard(${WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'})`;

  EnhancedFormWizard.propTypes = {
    routes: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          childRoutes: PropTypes.arrayOf(
            PropTypes.shape({
              path: PropTypes.string.isRequired,
              wizardFormOrder: PropTypes.number,
            }),
          ),
          isWizardForm: PropTypes.bool.isRequired,
        }),
        PropTypes.objectOf(PropTypes.any),
      ]),
    ).isRequired,
    registerWizardForm: PropTypes.func.isRequired,
    destroyWizardForm: PropTypes.func.isRequired,
    submitWizardForm: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    /* eslint-disable react/no-unused-prop-types */
    stepPaths: PropTypes.arrayOf(PropTypes.string).isRequired,
    lastMountedStepIndex: PropTypes.number.isRequired,
    /* eslint-enable react/no-unused-prop-types */
    submitting: PropTypes.bool.isRequired,
  };

  EnhancedFormWizard.defaultProps = {
    onSubmit: null,
  };

  EnhancedFormWizard.childContextTypes = {
    enhancedFormWizard: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
  };

  const stepsSelector = createWizardStepsSelector(wizardFormConfig.name, true);
  const stepPathsSelector = createWizardStepPathsSelector(wizardFormConfig.name, true);

  return connect(
    state => {
      if (state.enhancedForm.wizard[wizardFormConfig.name]) {
        const wizard = state.enhancedForm.wizard[wizardFormConfig.name];
        const steps = stepsSelector(state.enhancedForm.wizard);

        // look up the visible step index that corresponds with the last mounted one
        let visibleStepIndex = -1;
        let findStepIndex = wizard.lastMountedStepIndex;
        const findStepIndexFunc = step => step.stepIndex === findStepIndex;
        // try to find the step, else try the previous one
        while (visibleStepIndex === -1 && findStepIndex !== -1) {
          visibleStepIndex = steps.findIndex(findStepIndexFunc);
          --findStepIndex; // eslint-disable-line no-plusplus
        }

        return {
          submitting: wizard.submitting,
          lastMountedStepIndex: wizard.lastMountedStepIndex,
          // when hiding some steps for progress, this will find the correct index for non-hidden
          // steps, so we can correctly use this in the stepIndicator
          lastMountedVisibleStepIndex: visibleStepIndex,
          stepPaths: stepPathsSelector(state.enhancedForm.wizard),
        };
      }
      return {
        submitting: false,
        lastMountedStepIndex: -1,
        stepPaths: [],
      };
    },
    dispatch => ({
      registerWizardForm: steps => dispatch(registerWizardForm(wizardFormConfig.name, steps)),
      submitWizardForm: onSubmit =>
        dispatch(
          submitWizardForm(
            wizardFormConfig.name,
            onSubmit,
            wizardFormConfig.transformApiFieldNames,
            wizardFormConfig.generalErrorMessage,
            path => dispatch(historyPush(path)),
          ),
        ),
      destroyWizardForm: () => dispatch(destroyWizardForm(wizardFormConfig.name)),
    }),
  )(EnhancedFormWizard);
};

export default enhancedFormWizard;
