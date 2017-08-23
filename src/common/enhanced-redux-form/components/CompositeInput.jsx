import React, { PropTypes, PureComponent } from 'react';
import { FormSection } from 'redux-form';
import { connect } from 'react-redux';
import {
  registerCompositeInput,
  unregisterCompositeInput,
  composeCompositeInputs,
  decomposeCompositeInput,
} from '../actions/compositeInputActions';
import compositeInputFormatters from '../compositeInputFormatters';
import { COMPOSITE_FORMSECTION_NAME_PREFIX } from '../data/constants';
import * as ComposeOn from '../data/ComposeOn';

/**
 * @module enhanced-redux-form/components/CompositeInput
 */

/* eslint-disable consistent-return */
const validateFormatterProp = (props, propName, componentName) => {
  const formatter = props[propName];

  if (!formatter.name || !formatter.formatter) {
    return new Error(
      `Invalid prop '${propName}' supplied to '${componentName}'. ${propName} should be of shape {name:string, formatter:<formatter config>}`,
    );
  }

  if (!compositeInputFormatters[formatter.name]) {
    return new Error(
      `Invalid prop '${propName}' supplied to '${componentName}'. ${formatter.name} does not exist in compositeInputFormatters.js`,
    );
  }
};
/* eslint-enable consistent-return */

/* eslint-disable no-underscore-dangle */

/**
 * For documentation, please refer to the tutorial:
 * {@tutorial enhanced-redux-form-composite-inputs}
 *
 * @class CompositeInput
 * @category forms
 * @tutorial enhanced-redux-form-composite-inputs
 */
class CompositeInput extends PureComponent {
  componentWillMount() {
    const { formatter, composeOn, value } = this.props;
    const { form, register } = this.context._reduxForm;
    const name = this.getName();
    register(name, 'Field');
    this.props.registerCompositeInput(form, name, formatter, composeOn);

    if (value) {
      this.props.decomposeCompositeInput(form, name);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.name !== nextProps.name || this.props.formatter !== nextProps.formatter) {
      const { form, unregister, register } = this.context._reduxForm;
      const currentName = this.getName();
      const newName = this.getName(nextProps);

      unregister(currentName);
      this.props.unregisterCompositeInput(form, currentName);
      register(newName, 'Field');
      this.props.registerCompositeInput(form, newName, nextProps.formatter, nextProps.composeOn);

      this.props.composeCompositeInputs(form, [newName]);
    } else if (this.props.value !== nextProps.value) {
      const name = this.getName(nextProps);
      this.props.decomposeCompositeInput(nextProps.form, name);
    }
  }

  componentWillUnmount() {
    const { form } = this.context._reduxForm;
    const name = this.getName();

    this.context._reduxForm.unregister(name);
    this.props.unregisterCompositeInput(form, name);
  }

  /**
   * Get the prefixed name based on the name prop and the context. Based on the prefixName.js
   * util in redux-form.
   * @param {object} props? The current props of the component. Defaults to this.props
   * @returns {string} The prefixed name
   */
  getName(props = this.props) {
    const { sectionPrefix } = this.context._reduxForm;
    const { name } = props;
    const isFieldArrayRegx = /\[\d+]$/;

    return !sectionPrefix || isFieldArrayRegx.test(name) ? name : `${sectionPrefix}.${name}`;
  }

  render() {
    const { name, children } = this.props;

    return (
      <FormSection name={`${COMPOSITE_FORMSECTION_NAME_PREFIX}${name}`}>
        {children}
      </FormSection>
    );
  }
}

CompositeInput.defaultProps = {
  value: null,
  form: null,
  formatter: null,
  composeOn: ComposeOn.VALIDATE,
  children: null,
};

CompositeInput.propTypes = {
  /*
   * The name of the combined input
   */
  name: PropTypes.string.isRequired,
  /*
   * The value of this CompositeInput in the redux state. Passed by the connect() wrapper
   */
  value: PropTypes.any,
  /*
   * The name of the wrapping form. Passed by the CompositeInputWrapper
   */
  form: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  /*
   * A formatter definition to use to combine the input values into a single composite
   * value. Should be one of the formatters defined in 'compositeInputFormatters.js'
   */
  formatter: validateFormatterProp,
  /*
   * Prop that defines on which events this CompositeInput should run the formatter function
   * to combine the child field values into a single value. Should be one of the values
   * from composeOn.js
   * If not provided, will default to ComposeOn.VALIDATE  (null)
   */
  composeOn: PropTypes.oneOf([
    ComposeOn.VALIDATE_AND_BLUR,
    ComposeOn.VALIDATE_AND_CHANGE,
    ComposeOn.VALIDATE_AND_FOCUS,
  ]),
  registerCompositeInput: PropTypes.func.isRequired,
  unregisterCompositeInput: PropTypes.func.isRequired,
  decomposeCompositeInput: PropTypes.func.isRequired,
  composeCompositeInputs: PropTypes.func.isRequired,
  children: PropTypes.node,
};

CompositeInput.contextTypes = {
  _reduxForm: PropTypes.object.isRequired,
};

const ConnectedCompositeInput = connect(
  (state, { name, form }) => ({
    value: state.form[form] && state.form[form].values && state.form[form].values[name],
  }),
  {
    registerCompositeInput,
    unregisterCompositeInput,
    composeCompositeInputs,
    decomposeCompositeInput,
  },
)(CompositeInput);

/* eslint-disable no-underscore-dangle */
const CompositeInputWrapper = (props, context) =>
  <ConnectedCompositeInput {...props} form={context._reduxForm.form} />;

CompositeInputWrapper.contextTypes = {
  _reduxForm: PropTypes.object.isRequired,
};
/* eslint-enable no-underscore-dangle */

export default CompositeInputWrapper;
