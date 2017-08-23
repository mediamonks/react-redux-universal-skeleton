/* global WP_COMPONENT_DEF */
import React from 'react';
import PropTypes from 'prop-types';
import { withFunctionalClassName } from 'src/common/util/componentClassNameUtils';

import './application-error.scss';

const ApplicationError = (props, context, className) => {
  const { children } = props;

  return (
    <div className={className}>
      <div>
        {children}
      </div>
    </div>
  );
};

ApplicationError.propTypes = {
  children: PropTypes.node.isRequired,
};

export default withFunctionalClassName(WP_COMPONENT_DEF)(ApplicationError);
