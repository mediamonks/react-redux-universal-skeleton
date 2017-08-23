/* global WP_DEFINE_DEVELOPMENT */
import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { push as historyPush } from 'react-router-redux';
import { validateForm, registerForm, submitForm } from './actions/enhancedFormActions';
import { wizardStepMount } from './actions/wizardFormActions';

/** @module enhanced-redux-form */
const enhancedForm = (reduxFormConfig, validation) => WrappedComponent => {
  class EnhancedForm extends Component {
    componentWillMount() {
      if (WP_DEFINE_DEVELOPMENT) {
        if (
          this.context.enhancedFormWizard &&
          (typeof reduxFormConfig.destroyOnUnmount === 'undefined' ||
            reduxFormConfig.destroyOnUnmount)
        ) {
          throw new Error(
            'enhancedReduxForm should be passed {destroyOnUnmount: false} if part of an enhancedFormWizard',
          );
        }
      }

      this.props.registerForm();

      if (this.context.enhancedFormWizard) {
        const { routes } = this.context.router;
        const { path } = routes[routes.length - 1];
        this.props.wizardStepMount(this.context.enhancedFormWizard.name, path);
      }
    }

    componentWillReceiveProps(props) {
      if (props.shouldValidate.length) {
        this.props.validateForm(props.shouldValidate);
      }
    }

    submit = event => {
      if (event) {
        event.preventDefault();
      }
      this.props.submitForm();
    };

    render() {
      /* eslint-disable no-unused-vars */
      const {
        // we create variables here so they are excluded from 'formProps'
        validateForm: validateFormProp,
        wizardStepMount: wizardStepMountProp,
        generalError,
        submitForm: submitFormProp,
        registerForm: registerFormProp,
        onSubmit: onSubmitProp,
        shouldValidate: shouldValidateProp,
        ...formProps
      } = this.props;
      /* eslint-enable no-unused-vars */

      return (
        <WrappedComponent
          {...formProps}
          submitForm={null}
          shouldValidate={null}
          registerForm={null}
          error={generalError}
          handleSubmit={this.submit}
        />
      );
    }
  }

  EnhancedForm.displayName = `enhancedReduxForm(${WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'})`;
  EnhancedForm.propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    form: PropTypes.string.isRequired,
    registerForm: PropTypes.func.isRequired,
    wizardStepMount: PropTypes.func.isRequired,
    validateForm: PropTypes.func.isRequired,
    submitForm: PropTypes.func.isRequired,
    generalError: PropTypes.string,
    // eslint-disable-next-line react/no-unused-prop-types
    onSubmit: PropTypes.func,
    // eslint-disable-next-line react/no-unused-prop-types
    shouldValidate: PropTypes.arrayOf(PropTypes.string).isRequired,
  };
  EnhancedForm.defaultProps = {
    generalError: '',
    onSubmit: null,
  };
  EnhancedForm.contextTypes = {
    enhancedFormWizard: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }),
    router: PropTypes.shape({
      location: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  };

  return connect(
    (state, props) => {
      const validationState = state.enhancedForm.validation[props.form];

      return {
        shouldValidate: validationState ? validationState.shouldValidate || [] : [],
        generalError: validationState ? validationState.generalError : null,
      };
    },
    (dispatch, props) => {
      /**
       * We get history.push if it is defined on router, because this form might be mounted
       * in <QueryRouting />, which has a different history
       * @type {*}
       */
      const formHistoryPush =
        (props.router && props.router.push) || (path => dispatch(historyPush(path)));

      return {
        validateForm: fields => dispatch(validateForm(validation, props.form, fields)),
        registerForm: () => dispatch(registerForm(props.form, validation)),
        wizardStepMount: (wizardName, routePath) =>
          dispatch(wizardStepMount(props.form, wizardName, routePath, formHistoryPush)),
        submitForm: () =>
          dispatch(
            submitForm(
              props.form,
              validation,
              props,
              props.onSubmit || reduxFormConfig.onSubmit,
              props.transformApiFieldNames || reduxFormConfig.transformApiFieldNames,
              props.onSubmitSuccess || reduxFormConfig.onSubmitSuccess,
              props.onSubmitFail || reduxFormConfig.onSubmitFail,
              props.generalErrorMessage || reduxFormConfig.generalErrorMessage,
              formHistoryPush,
            ),
          ),
      };
    },
  )(EnhancedForm);
};

/**
 * @name ValidationRule
 * @property {function} rule A function that returns true or false for valid or invalid. May
 * also return a promise that resolves with true or false. It will receive the following arguments:
 *  - **value** The current value of the field
 *  - **values** An object containing all the values in the form
 *  - **name** The name of the field that is being validated
 * @property {string|Object} [message] A message that should be set as error message when
 * this field is invalid. Can be either a string, or an object with the following properties:
 *  - **locale** The id of the locale string to lookup
 *  - **params** (optional) The MessageFormat parameters to pass to the locale string
 * @property {string} [code] A unique string to identify the error. Can be used to implement
 * custom error messages
 */

/**
 * @name ValidationConfig
 * @type {object}
 * @property {string|Array<string>} [validateOn] A string or array of strings that specifies
 * on which event the validation should trigger. See ValidateOn.js for possible values.
 * @property {Array<module:enhanced-redux-form~ValidationRule>} validators An array of validation
 * rules to test this field for.
 */

/**
 * Returns a function that wraps a component in enhanced-redux-form functionality. Syntax
 * is similar to the reduxForm() method of redux-form:
 *
 * `const MyEnhancedForm = enhancedReduxForm(reduxFormConfig, validation)(MyForm);`
 *
 * @default
 * @function enhancedReduxForm
 * @tutorial enhanced-redux-form
 * @param {Object} reduxFormConfig The configuration object that will be passed to redux-form. The
 * enhanced configuration object allows the following additional properties:
 * @param {Object} [reduxFormConfig.wizard] If passed, indicates that this form is part of a
 * multi-step wizard form
 * @param {number} [reduxFormConfig.wizard.index] The index of this step in the wizard
 * @param {string} [reduxFormConfig.wizard.route] The route that this form will be available under.
 * When an error occurs in the submission, we will navigate to this route
 * @param {string} [reduxFormConfig.transformApiFieldNames] A function that maps each field
 * name in an API validation response to a field name in this form. Can be used to map flattened
 * field names in the API back to nested names in redux-form.
 * @param {Object<string, module:enhanced-redux-form~ValidationConfig>} validation The validation
 * configuration object. The keys of this object correspond to names of fields in the form, and the
 * values are the corresponding validation configs.
 * @returns {function} The function that wraps a component in an enhanced component with
 * enhanced-redux-form functionality
 * @category forms
 */
export default (reduxFormConfig, validation = {}) => component =>
  reduxForm(reduxFormConfig)(enhancedForm(reduxFormConfig, validation)(component));
