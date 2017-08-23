import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { makeGetErrorsForFields } from 'src/common/enhanced-redux-form/reducers/validationReducer';
import HideOnError from './HideOnError';

const outerPropTypes = {
  /**
   * The field names to check for error codes in the validation
   */
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
  /**
   * If on of these error codes is present in one of the fields specified in 'fields', we will
   * hide the children
   */
  errorCodes: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ConnectedHideOnError = connect(() => {
  const getErrorsForFields = makeGetErrorsForFields();

  return (state, props) => {
    const errors = getErrorsForFields(state.enhancedForm.validation, props);

    return {
      hasError: !!errors.find(error => props.errorCodes.includes(error.code)),
    };
  };
}, null)(HideOnError);
ConnectedHideOnError.propTypes = {
  ...outerPropTypes,
  form: PropTypes.string.isRequired,
};

/* eslint-disable no-underscore-dangle */
const FormNameProvider = (props, context) =>
  <ConnectedHideOnError {...props} form={context._reduxForm.form} />;
FormNameProvider.propTypes = outerPropTypes;
FormNameProvider.contextTypes = {
  _reduxForm: PropTypes.object.isRequired,
};
/* eslint-enable no-underscore-dangle */

export default FormNameProvider;
