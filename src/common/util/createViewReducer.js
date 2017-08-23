/**
 * @module app/util/createViewReducer
 */

/**
 * Adds a boolean flag to a function indicating that it is a view reducer. This
 * is used by createViewReducer to identify child reducers that have been created
 * using createViewReducer() and attach them appropriately.
 *
 * @function addViewReducerFlag
 * @private
 * @param {function} func Function to add the flag to
 * @returns {function} The input function
 */
const addViewReducerFlag = func => {
  func.isViewReducer = true; // eslint-disable-line no-param-reassign
  return func;
};

/**
 * This utility creates a special type of reducer to facilitate the functionality of
 * the generic view reducers like entityViewReducer and entityListViewReducer. The syntax
 * is very similar to the
 * {@link http://redux.js.org/docs/api/combineReducers.html|redux combineReducers} util.
 *
 * Child reducers passed to createViewReducer are only called under either of the following
 * conditions:
 *  - the child reducer itself is also created with createViewReducer()
 *  - an action is dispatched with a 'view' property on 'meta' with the exact location of the
 *  child reducer in the view state tree. For example, the child reducer 'articles' in a view
 *  reducer nested under 'pages.home' will only be called if the action contains the following
 *  data: { meta: {view: 'pages.home.articles'} }.
 *
 * **important: ** because this util does not output a regular reducer function, the returned
 * view reducer should _only_ be nested under other reducers created with createViewReducer().
 *
 * It is possible to also include regular reducer logic in the resulting view reducer. To do
 * this, pass a regular reducer to the returned function. The view reducer will be merged with
 * the regular reducer.
 *
 * @function createViewReducer
 * @param childReducerMap An object of child view reducers that should be combined into this
 * reducer. See {@link http://redux.js.org/docs/api/combineReducers.html|redux combineReducers}
 * @example // import child view reducers
 * import modal from './modalReducer';
 * import pages from './pagesReducer';
 *
 * // create a regular reducer
 * const myReducer = handleActions( ... );
 *
 * // create a view reducer
 * const myViewReducer = createViewReducer({
 *   modal,
 *   pages,
 * });
 *
 * // export the view reducer merged with the regular reducer
 * export default myViewReducer(myReducer);
 *
 */
const createViewReducer = childReducerMap =>
  addViewReducerFlag(namespaceOrWrappedReducer => {
    if (typeof namespaceOrWrappedReducer === 'function') {
      // another reducer is passed to this function. merge that reducer with the new view reducer
      const wrappedReducer = namespaceOrWrappedReducer;

      return addViewReducerFlag(namespace => {
        const innerViewReducer = createViewReducer(childReducerMap)(namespace);

        return (state, action) => {
          if (typeof state === 'undefined') {
            return {
              ...wrappedReducer(state, action),
              ...innerViewReducer(state, action),
            };
          }
          return innerViewReducer(wrappedReducer(state, action), action);
        };
      });
    } else if (typeof namespaceOrWrappedReducer !== 'string') {
      // if the first argument is not a string or a function, this reducer is probably
      // nested under a regular reducer
      throw new Error(
        'A view reducer created with createViewReducer() should only be included in another view reducer.',
      );
    }

    // a namespace is passed to this reducer by a parent view reducer
    const namespace = namespaceOrWrappedReducer;

    return (state, action) => {
      let isInitial = false;
      let hasChanged = false;

      if (typeof state === 'undefined') {
        isInitial = true;
      }
      const newState = { ...(state || {}) };

      Object.keys(childReducerMap).forEach(childReducerKey => {
        const childNamespace = namespace ? `${namespace}.${childReducerKey}` : childReducerKey;
        const childReducer = childReducerMap[childReducerKey];

        if (
          isInitial ||
          childReducer.isViewReducer ||
          !(action.meta && action.meta.view) ||
          action.meta.view === childNamespace
        ) {
          const prevChildState = newState[childReducerKey];
          newState[childReducerKey] = childReducer.isViewReducer
            ? childReducer(childNamespace)(prevChildState, action)
            : childReducer(prevChildState, action);

          hasChanged = hasChanged || newState[childReducerKey] !== prevChildState;
        }
      });

      // if there was no change in child reducers, return the original object to make sure
      // the reference doesn't change
      return hasChanged ? newState : state;
    };
  });

export default createViewReducer;
