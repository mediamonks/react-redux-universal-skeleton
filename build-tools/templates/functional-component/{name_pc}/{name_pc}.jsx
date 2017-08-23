/* global WP_COMPONENT_DEF */
import React from 'react';
import PropTypes from 'prop-types';
import { withFunctionalClassName } from 'src/common/util/componentClassNameUtils';

const {{name_pc}} = () => (
	<div>
		<h1>{{name_pc}}</h1>
	</div>
);

{{name_pc}}.propTypes = {
};

export default withFunctionalClassName(
  WP_COMPONENT_DEF
)({{name_pc}})
