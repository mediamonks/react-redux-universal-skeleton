import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import { Field } from 'redux-form';
import debugLib from 'debug';
import { makeGetCustomValidationMeta } from '../reducers/validationReducer';

/**
 * @module enhanced-redux-form/components/EnhancedField
 */

const debug = debugLib('React:EnhancedField');

const createEnhancedInputComponent = InputComponent => {
  const ConnectedInputComponent = connect(
    () => {
      const getCustomValidationMeta = makeGetCustomValidationMeta();

      return (state, props) => getCustomValidationMeta(state.enhancedForm.validation, props);
    },
    null,
    (stateProps, dispatchProps, ownProps) => ({
      ...ownProps,
      meta: {
        ...ownProps.meta,
        ...stateProps.meta,
      },
    }),
  )(InputComponent);

  /* eslint-disable no-underscore-dangle */
  const EnhancedInputComponent = (props, context) =>
    <ConnectedInputComponent {...props} form={context._reduxForm.form} />;
  EnhancedInputComponent.contextTypes = {
    _reduxForm: PropTypes.object.isRequired,
  };
  /* eslint-enable no-underscore-dangle */

  return EnhancedInputComponent;
};

/**
 * Should be used instead of the redux-form &lt;Field&gt; component to provide
 * enhanced-redux-form functionality to inputs. The API for this component is exactly the
 * same as the &lt;Field&gt; component. Please see the
 * {@link http://redux-form.com/6.3.1/docs/api/Field.md/|redux-form documentation}
 * for more info.
 * @class EnhancedField
 * @category forms
 */
class EnhancedField extends Component {
  // eslint-disable-next-line react/sort-comp
  EnhancedInput = null;

  componentWillMount() {
    this.EnhancedInput = createEnhancedInputComponent(this.props.component);
    this.context.registerWizardField && this.context.registerWizardField(this.props.name);
  }

  componentDidMount() {
    const domNode = findDOMNode(this);
    if (domNode) {
      const input = domNode.querySelector(
        'input[type=text],input[type=email],input[type=password]',
      );
      if (input) {
        const { _reduxForm: formContext } = this.context;
        if (formContext) {
          const values = formContext.values || {};

          if (input.value && values[this.props.name] !== input.value) {
            formContext.dispatch(formContext.change(this.props.name, input.value));
          }
        }
      }
    }
  }

  componentWillReceiveProps({ component }) {
    if (component !== this.props.component) {
      debug('Ignored change of "component" prop. Prop cannot be changed after mount.');
    }
  }

  render() {
    const { EnhancedInput } = this;
    return <Field {...this.props} component={EnhancedInput} />;
  }
}

EnhancedField.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  component: PropTypes.any.isRequired,
  name: PropTypes.string,
};

EnhancedField.contextTypes = {
  registerWizardField: PropTypes.func,
  _reduxForm: PropTypes.object.isRequired,
};

export default EnhancedField;
