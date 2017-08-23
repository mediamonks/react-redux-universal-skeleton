/* global WP_COMPONENT_DEF */
import React from 'react';
import PropTypes from 'prop-types';
import { withFunctionalClassName } from 'src/common/util/componentClassNameUtils';
import ApplicationError from 'src/common/components/ApplicationError';

const GeneralError = (props, context, className) => {
  const { error = {} } = props;

  return (
    <div>
      <ApplicationError className={className}>
        <h1>Oops, something went wrong!</h1>
        {error.message
          ? error.message
          : <p>We&apos;re sorry for the error. Please close your browser and try again shortly.</p>}
      </ApplicationError>
    </div>
  );
};

GeneralError.defaultProps = {
  error: null,
};

GeneralError.propTypes = {
  error: PropTypes.shape({
    code: PropTypes.string,
    message: PropTypes.string,
  }),
};

export default withFunctionalClassName(WP_COMPONENT_DEF)(GeneralError);
