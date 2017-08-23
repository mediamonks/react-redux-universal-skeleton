```
// import named exports like PropTypes and Component, instead of React.PropTypes
// makes it more clear what is used, and shorter to use
import React, { Component, PropTypes } from 'react';
import { componentClassNameProp } from 'src/common/util/componentClassNameUtils';

export default class Example extends Component {

  // declare event handler like arrow functions
  // so they keep their correct 'this' scope
  // and you don't have to `bind(this)` them.
  //
  // Start your handlers with `handle`, end them with the event
  // they handle (e.g. `click`, `change`), and fill up the middle
  // to specify what element is handled.
  // Examples: `handleFormSubmit`, `handleEmailChange
  // Not: `collapseView`, `handleToggle`
  handleFooButtonClick = (event) => {
    event.preventDefault();
    // do something
  };

  // When you need to execute some other logic before calling
  // the prop callback, use a normal handler and then call the prop.
  // When optional, always check if the prop is defined.
  handleFooButtonClick = (event) => {
    if (event) {
      this.props.onClose && this.props.onClose();
    }
  };

  render() {
    const { onClose } = this.props;

    return (
      <div {...componentClassNameProp(this)} >
        {/* no bind needed in the onClick handler */}
        <button onClick={this.handleFooButtonClick}>foo</button>

        {/* pass callback props directly
            you can easily spot the difference vs handlers
            missing `this` and `on` instead of `handle`.
         */}
        <button onClick={onClose}>bar</button>

        <button onClick={this.handleFooButtonClick}>bar</button>
      </div>
    );
  }
}

Example.propTypes = {
  onClose: PropTypes.func,
};
```
