/**
 * @module redux-listeners-middleware
 */

class ActionListener {
  constructor({ actionType, filter }, handler) {
    this.actionTypes = [].concat(actionType || []);
    this.filters = [].concat(filter || []);
    this.handler = handler;
  }

  matchesFilter = (action, getState) => this.filters.every(filter => filter(action, getState));
}

/**
 * This callback will be called by
 * {@link module:redux-listeners-middleware~reduxListenersMiddleware|reduxListenersMiddleware} on
 * initialization. Inside of it you can attach multiple action listeners by calling the addListener
 * function.
 *
 * @callback setupFunction
 * @param {addListenerFunction} addListener Callback that can be used to add a new action listener.
 * See {@link module:redux-listeners-middleware~addListenerFunction|addListenerFunction}
 */

/**
 * @callback addListenerFunction
 * @param {object} options
 * @param {string|Array<string>} [options.actionType] An action type or array of action type that
 * will be listened to. If not set, this listener will listen to any action type. However, for
 * performance reasons it is recommended to add action types here whenever possible.
 * @param {function|Array<function>} [options.filter] A function or array of functions that filter
 * the incoming actions. Receives the following parameters:
 *  - `action` The action object
 *  - `getState` A function that can be called to get the current Redux state
 *
 * Should return `true` if the handler function should be called.
 * @param {function} handler Handler function that will be called when an action is dispatched
 * that matches this listener.
 */

/**
 * Redux middleware that can be used to attach listeners to Redux actions.
 *
 * **IMPORTANT**: This should only be used to add additional side-effects to Redux actions, such
 * as event tracking. Using this middleware to do application logic is an anti-pattern.
 *
 * @category tracking
 * @function reduxListenersMiddleware
 * @param {setupFunction|setupFunction[]} setupFuncs An array of setup functions or a single setup
 * function that adds listeners for redux actions. See
 * {@link module:redux-listeners-middleware~setupFunction|setupFunction} for more info.
 * @returns {function} A middleware function that can be passed to Redux's
 * {@link http://redux.js.org/docs/api/applyMiddleware.html|applyMiddleware()}
 */
export default setupFuncs => {
  const listenersByActionType = {};
  const anyActionTypeListeners = [];

  function addListener(options, handler) {
    const listener = new ActionListener(options, handler);

    if (options.actionType) {
      [].concat(options.actionType).forEach(actionType => {
        if (!listenersByActionType[actionType]) {
          listenersByActionType[actionType] = [];
        }

        listenersByActionType[actionType].push(listener);
      });
    } else {
      anyActionTypeListeners.push(listener);
    }
  }

  [].concat(setupFuncs).forEach(setup => setup(addListener));

  return ({ getState }) => next => action => {
    const actionTypeListeners = (action.type && listenersByActionType[action.type]) || [];

    anyActionTypeListeners.concat(actionTypeListeners).forEach(listener => {
      if (listener.matchesFilter(action, getState)) {
        listener.handler(action, getState);
      }
    });

    return next(action);
  };
};
