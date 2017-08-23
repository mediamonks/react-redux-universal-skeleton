import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { componentClassNameProp } from 'src/common/util/componentClassNameUtils';

class {{name_pc}} extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	componentDidMount() {

	}

	render() {
		return (
			<div {...componentClassNameProp(this)}>
				<h1>{{name_pc}}</h1>
			</div>
		);
	}
}

{{name_pc}}.propTypes = {
};

export default {{name_pc}};
