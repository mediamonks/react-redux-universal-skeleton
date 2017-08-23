```
// import named exports like PropTypes and Component, instead of React.PropTypes
// makes it more clear what is used, and shorter to use
import React, { Component, PropTypes } from 'react';
// place all module imports above any relative imports
import { componentClassNameProp } from 'src/common/util/componentClassNameUtils';

// import css at the bottom of all the imports (whith a blank line above
// import './example.scss';

// use es6 style classes
export default class Example extends Component {
  constructor(props) {
    super(props);

    // define state in the constructor, because sometimes you need info from the props
    this.state = {
      foo: 'bar',
    };
  }

  render() {
    // destructuring from state and props is a good way to show what variables you are using here
    const { size, children } = this.props;
    const { foo } = this.state;

    return (
      <div foo={foo}
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
```
