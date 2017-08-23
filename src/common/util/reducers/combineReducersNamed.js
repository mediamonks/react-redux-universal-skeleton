import { combineReducers } from 'redux';

/**
 * Wrapper function to combinedReducer that will add a name to the reducer. The name will be
 * passed on to child named reducers, such that each reducer will automatically have a name
 * that matches the nesting of the reducer. For example, a reducer nested as:
 * ```
 * { view: { pages: { homePage: { myReducer } } } }
 * ```
 * will have the name `view.pages.homePage.myReducer`.
 *
 * This name is used by the `targetedReducer()` utility. It makes sure that the passed
 * reducer will only respond to actions with a `target` property in the action`meta` that matches
 * the reducer name.
 *
 * @function combineReducersNamed
 * @param reducerMap A map containing child reducers. This uses the same syntax as the redux
 * `combineReducers` parameter. See
 * {@link http://redux.js.org/docs/api/combineReducers.html|combineReducers}
 * @returns {function} A named reducer. This reducer should only be included in another named
 * reducer.
 */
export default reducerMap => {
  const namedReducer = name => {
    if (typeof name !== 'string') {
      // if the first argument is not a string, this reducer is probably
      // nested under a regular reducer
      throw new Error(
        'A reducer created with combineReducersNamed() should only be included in another named reducer.',
      );
    }

    const combineReducersMap = {};
    const postFixedName = name ? `${name}.` : name;

    Object.keys(reducerMap).forEach(reducerName => {
      combineReducersMap[reducerName] = reducerMap[reducerName].isNamedReducer
        ? reducerMap[reducerName](`${postFixedName}${reducerName}`)
        : reducerMap[reducerName];
    });

    return combineReducers(combineReducersMap);
  };

  namedReducer.isNamedReducer = true;
  return namedReducer;
};
