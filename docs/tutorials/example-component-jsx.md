```
import React, { Component } from 'react';
import { componentClassNameProp } from 'src/common/util/componentClassNameUtils';

export default class Example extends Component {

  render() {
    const size = 'medium';
    let children;

    // always use the ref-function, the `this.ref.foo` usage is deprecated
    return (
      <div ref={ref => { this.fooRef = ref; }}
           {...componentClassNameProp(this, null, `size-${size}`)}>

        {/* use if like this */}
        {children ?
          React.cloneElement(children)
        : null}

        {/* use if-else like this */}
        {children ?
          React.cloneElement(children)
        :
          <div />
        }

        {/* use multiple nodes as array like this */}
        {children ? [
          React.cloneElement(children),
          <div />,
        ] : null}

        {/* use map like this, always set a key, never use the iterator index */}
        {children && children.map(child => (
          <div key={child.id}>{child}</div>
        ))}

      </div>
    );
  }
}
```
