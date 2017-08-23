import debugLib from 'debug';

const debug = debugLib('React:CancellableCallback');

const cancelled = () => debug('Ignored call to cancelled callback');

/**
 * Returns a new function that has a `cancel()` method on it. When the cancel
 * method is called, the passed callback will be unreferenced so it is available
 * for garbage collection. After that, any future calls to the returned function
 * will be ignored.
 *
 * This util is meant to be used when having callbacks inside a React component.
 * Once the component is unmounted, the callback can be cancelled so the react component
 * itself is unreferenced and no further calls to `setState()` are made from
 * the callback. See
 * {@link https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html|isMounted is
 * an Antipattern}
 *
 * @param {function} callback The callback to wrap
 * @returns {function}
 */
function cancellableCallback(callback) {
  const cancellable = (...params) => callback(...params);
  cancellable.cancel = () => {
    callback = cancelled; // eslint-disable-line no-param-reassign
  };
  return cancellable;
}

export default cancellableCallback;
