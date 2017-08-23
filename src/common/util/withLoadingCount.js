/** @module */

/**
 * Adds a loading count to the given reducer. For each of the given action types,
 * the count will increase when an action is dispatched with a 'pending' state.
 * The count is decreased again when the an action is dispatched in the 'resolved'
 * or 'rejected' state.
 *
 * To dispatch actions with these states, dispatch an action with a promise as
 * payload. The asyncActionMiddleware util will automatically convert these actions
 * to separate pending, resolved and rejected actions.
 *
 * @function withLoadingCount
 * @param {function} wrappedReducer The reducer to add a 'loading' count to.
 * @param {Array<string>} asyncActionTypes The action types that this loading count
 * should respond to. Actions with other types are ignored.
 * @returns {function} The enhanced reducer
 * @category api-calls
 */
const withLoadingCount = (wrappedReducer, asyncActionTypes) => {
  if (wrappedReducer.isNamedReducer) {
    const namedReducer = name => withLoadingCount(wrappedReducer(name), asyncActionTypes);
    namedReducer.isNamedReducer = true;
    return namedReducer;
  }

  return (state, action) => {
    if (typeof state === 'undefined') {
      return {
        ...wrappedReducer(state, action),
        loading: 0,
      };
    }

    const newState = wrappedReducer(state, action);
    if (action.meta && action.meta.isAsync && asyncActionTypes.includes(action.type)) {
      return {
        ...newState,
        loading: state.loading + (action.meta.isFulfilled ? -1 : 1),
      };
    }
    return newState;
  };
};

export default withLoadingCount;
