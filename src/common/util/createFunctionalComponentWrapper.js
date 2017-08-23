import { getDisplayName } from 'recompose';

/**
 * An array of properties that will be transferred from the wrapped functional component to
 * the wrapper returned by createFunctionalComponentWrapper()
 * @type {Array<string>}
 */
const REACT_STATICS = [
  'propTypes',
  'defaultProps',
  'contextTypes',
  'getDefaultProps',
  'childContextTypes',
];

/**
 * **note** this does not create a true higher-order component. The inner component will not
 * have it's own lifecyle methods, it is just a function call. This is slightly cheaper than
 * wrapping the component with another component.
 *
 * Enhanced the given component wrapper function to make it also transfer all the react-related
 * statics on a component onto the wrapper. This is needed because unlike a normal HoC the
 * inner functional component is not rendered by React. It is simply a function call. This means
 * that all the static (propTypes, contextTypes, defaultProps) are lost if not copied over
 * explicitly to the wrapped function.
 * @function createFunctionalComponentWrapper
 * @param {function} wrapper A function that takes a functional component and returns a
 * new functional component.
 * @returns {function} A function that will use the original wrapper function to create
 * a new functional component and also transfers the react-related statics onto the
 * new component.
 */
const createFunctionalComponentWrapper = wrapper => WrappedComponent => {
  const Component = wrapper(WrappedComponent);
  Component.displayName = getDisplayName(WrappedComponent);
  REACT_STATICS.forEach(property => {
    Component[property] = WrappedComponent[property];
  });
  return Component;
};

export default createFunctionalComponentWrapper;
