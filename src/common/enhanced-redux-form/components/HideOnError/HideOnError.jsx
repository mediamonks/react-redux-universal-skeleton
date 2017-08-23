import React, { PropTypes } from 'react';
import { functionalComponentClassName } from 'src/common/util/componentClassNameUtils';

/**
 * @module enhanced-redux-form/components/HideOnError
 */

/**
 * Will hide children passed to the component if a relevant error is triggered.
 *
 * See index.js propTypes for props that need to be passed from the outside.
 *
 * @function HideOnError
 * @category forms
 */
const HideOnError = ({ children, hasError }) =>
  <div className={functionalComponentClassName('HideOnError')}>
    {hasError ? null : children}
  </div>;
HideOnError.propTypes = {
  /**
   * The contents to display in the error block. Will only display if showError is
   * true.
   */
  children: PropTypes.node.isRequired,
  /**
   * A boolean indicating if the error is present. Passed by the connect() wrapper
   * in index.js
   */
  hasError: PropTypes.bool.isRequired,
};

export default HideOnError;
