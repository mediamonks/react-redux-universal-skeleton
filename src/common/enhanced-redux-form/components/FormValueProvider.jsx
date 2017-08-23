import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { formValueSelector } from 'redux-form';

/**
 * @module enhanced-redux-form/components/formValueProvider
 */

/**
 * Helper component that injects form values into a child component, with as little
 * performance impact as possible. If one of the given form values change only the child
 * of this component will re-render (instead of the entire form).
 *
 * The form values will be available on the 'formValues' prop injected by this component.
 *
 * Please note: you can only pass 1 child component to this component
 *
 * @class FormValueProvider
 * @category forms
 * @example
 * const IntroCopy = ({ formValues: { firstName } }) => (<h1>Hi { firstName }!</h1>);
 *
 * <FormValueProvider fields={["firstName"]}>
 *   <IntroCopy />
 * </FormValueProvider>
 */
const FormValueProvider = ({ children, formValues }) => {
  const child = React.Children.only(children);

  return React.cloneElement(child, { formValues });
};

FormValueProvider.propTypes = {
  children: PropTypes.node.isRequired,
  formValues: PropTypes.objectOf(PropTypes.any).isRequired,
};

const ConnectedFormValueProvider = connect((_state, ownProps) => {
  const valueSelector = formValueSelector(ownProps.form);

  return (state, props) => {
    const formValues = valueSelector(state, ...props.fields);

    return props.fields.length > 1
      ? { formValues }
      : {
          formValues: {
            [props.fields[0]]: formValues,
          },
        };
  };
})(FormValueProvider);

ConnectedFormValueProvider.propTypes = {
  children: PropTypes.node.isRequired,
  form: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
};

/* eslint-disable no-underscore-dangle */
const FormValueProviderWrapper = (props, context) =>
  <ConnectedFormValueProvider {...props} form={context._reduxForm.form} />;
FormValueProviderWrapper.contextTypes = {
  _reduxForm: PropTypes.objectOf(PropTypes.any).isRequired,
};
FormValueProviderWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
};
/* eslint-enable no-underscore-dangle */

export default FormValueProviderWrapper;
