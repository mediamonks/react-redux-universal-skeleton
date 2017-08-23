```
// import named exports like PropTypes and Component, instead of React.PropTypes
// makes it more clear what is used, and shorter to use
import React, { Component, PropTypes } from 'react';
// place all module imports above any relative imports
import { connect } from 'react-redux';
import { componentClassNameProp } from 'src/common/util/componentClassNameUtils';

// import css at the bottom of all the imports (with a blank line above it)
// import './example.scss';

// when you connect this component to redux, export this unconnected component
// by name, so it can be imported by unit tests
export class Example extends Component {
  constructor(props) {
    super(props);

    // define your refs at the top, so it's clear what refs are available
    this.fooRef = null;

    // define state in the constructor, because sometimes you need info from the props
    this.state = {
      foo: 'bar',
      // When using props in the state, you should always use componentWillReceiveProps
      // to update the state, or else consecutive renders will not use the updated props
      // If possible, you should move this logic to the render function to prevent
      // duplication of code: https://facebook.github.io/react/tips/props-in-getInitialState-as-anti-pattern.html
      // Also, never use `this.props` here, as it doesn't work on older IE versions
      bar: props.size,
    };
  }

  // TODO: event handlers

  componentWillMount() {

  }

  componentDidMount() {
    // start using the DOM from this point
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      bar: nextProps.bar,
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    // be careful using this method
    // when you introduce new props/state, and you forget to update this check,
    // your component won't update
    // best is to use pure props
    return this.props.size !== nextProps.size || this.state.bar !== nextState.bar;
  }

  componentDidUpdate() {
    // not called for the first render
    // do DOM calculation after render here
  }

  componentWillUnmount() {

  }

  componentDidUnmount() {
    // clean up your stuff here
  }

  // TODO: render helper methods

  render() {
    // prefer to move logic at the top of the render method,
    // and only use simple variables in the JSX part

    // destructuring from state and props is a good way to show what variables you are using here
    const { size, children } = this.props;
    const { foo } = this.state;

    // always use the ref-function, the `this.ref.foo` usage is legacy
    // https://facebook.github.io/react/docs/more-about-refs.html
    return (
      <div ref={ref => { this.fooRef = ref; }}
           foo={foo}
           {...componentClassNameProp(this, null, `size-${size}`)}>
        {children}
      </div>
    );
  }
}

Example.propTypes = {
  /** Size of the buttons */
  size: PropTypes.oneOf([
    'large', 'medium', 'small',
  ]),
  children: PropTypes.node.isRequired,
};

Example.defaultProps = {
  size: 'medium',
};

const ConnectedExample = connect(
  // connect stuff here, see component-class-connect.js example for more
)(Example);

export default ConnectedExample;
```
