/**
 * Enhances the given reducer so it will only respond to actions that have a `target`
 * property on `meta` that exactly matches the name of this reducer. The name is
 * provided by the `combineReducersNamed()` utility on the parent reducer, so this
 * util can only be used when the resulting reducer is included using `combineReducersNamed()`.
 *
 * @function targetedReducer
 * @see combineReducersNamed
 * @param innerReducer The reducer to enhance
 * @returns {function} The enhanced reducer that will only respond to actions with the
 * correct `target` prop on `meta`.
 */
export default innerReducer => {
  const namedReducer = name => {
    if (typeof name !== 'string') {
      // if the first argument is not a string, this reducer is probably
      // nested under a regular reducer
      throw new Error(
        'A reducer created with targetedReducer() should only be included in a reducer created with combineReducersNamed().',
      );
    }

    return (state, action) => {
      if (
        typeof state === 'undefined' ||
        (action && action.meta && action.meta.target && action.meta.target === name)
      ) {
        return innerReducer(state, action);
      }

      return state;
    };
  };

  namedReducer.isNamedReducer = true;
  return namedReducer;
};
