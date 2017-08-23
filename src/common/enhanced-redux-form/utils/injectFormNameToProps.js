import React, { PropTypes } from 'react';

/** @module */

/**
 * Will wrap the given react component such that it reads the name of the current form
 * from the context (on the `_reduxForm` property). This name will be injected into `props`
 * as the `form` prop
 *
 * @function injectFormNameToProps
 * @param WrappedComponent The component that should ge the formname injected
 * @returns The wrapped react component
 */
const injectFormNameToProps = WrappedComponent => {
  /* eslint-disable no-underscore-dangle */
  const InjectFormNameWrapper = (props, context) =>
    <WrappedComponent {...props} form={context._reduxForm.form} />;

  InjectFormNameWrapper.contextTypes = {
    _reduxForm: PropTypes.object.isRequired,
  };
  /* eslint-enable no-underscore-dangle */

  InjectFormNameWrapper.displayName = `injectFormNameToProps(${WrappedComponent.displayName ||
    WrappedComponent.name ||
    'Component'})`;

  return InjectFormNameWrapper;
};

export default injectFormNameToProps;
