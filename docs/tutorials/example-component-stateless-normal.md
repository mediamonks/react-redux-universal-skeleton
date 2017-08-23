```
// import named exports like PropTypes and Component, instead of React.PropTypes
// makes it more clear what is used, and shorter to use
import React, { PropTypes } from 'react';
import { functionalComponentClassName } from 'src/common/util/componentClassNameUtils';

// when destructuring, place props on a separate line
const Example = ({
  foo,
  children,
}) => {
  // prefer to move logic at the top of the render method,
  // and only use simple variables in the JSX part
  let bar = foo;

  // always place jsx wrapped in parenthesis and indented
  return (
    <div bar={bar} className={functionalComponentClassName('Example')}>
      {children}
    </div>
  );
};

// always define propTypes, in a stateless component it can only be done this way
Example.propTypes = {
  foo: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default Example;
```
