import React, { Component } from 'react';

/**
 * This HoC will pass the context as props to the wrapped component
 *
 * @param contextTypes
 */
export default contextTypes => WrappedComponent =>
  /* eslint-disable react/prefer-stateless-function */
  class contextToPropsComponent extends Component {
    render() {
      return <WrappedComponent {...this.props} contextProps={this.context} />;
    }

    static contextTypes = contextTypes;
  };
