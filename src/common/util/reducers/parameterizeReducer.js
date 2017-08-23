import { extractPropsFromObject } from '../objectUtils';

export const toParamKey = (values, params) =>
  extractPropsFromObject(values, params)
    .map(val => (typeof val === 'undefined' ? '' : encodeURIComponent(val)))
    .join('&');

export default (reducer, params) => {
  const namedReducer = name => {
    if (typeof name !== 'string') {
      // if the first argument is not a string, this reducer is probably
      // nested under a regular reducer
      throw new Error(
        'A reducer wrapped in parameterizeReducer() should only be included in a reducer created with combineReducersNamed().',
      );
    }

    const innerReducer = reducer.isNamedReducer ? reducer(name) : reducer;

    return (
      state = {
        params,
        data: {},
      },
      action,
    ) => {
      if (
        action.meta &&
        action.meta.targetParams &&
        (!reducer.isNamedReducer || (action.meta.target && action.meta.target === name))
      ) {
        if (action.meta.targetParams === TARGET_ALL_PARAMS) {
          const newState = {
            ...state,
            data: { ...state.data },
          };
          Object.keys(state.data).forEach(paramKey => {
            newState.data[paramKey] = innerReducer(state.data[paramKey], action);
          });
          const dataChanged = Object.keys(state.data).some(
            paramKey => state.data[paramKey] !== newState.data[paramKey],
          );
          if (dataChanged) {
            return newState;
          }
        } else {
          const paramKey = toParamKey(action.meta.targetParams, params);

          const innerState = innerReducer(state.data[paramKey], action);

          if (innerState !== state.data[paramKey]) {
            return {
              ...state,
              data: {
                ...state.data,
                [paramKey]: innerState,
              },
            };
          }
        }
      }

      if (typeof state.init === 'undefined') {
        return {
          ...state,
          init: innerReducer(undefined, action),
        };
      }

      return state;
    };
  };

  namedReducer.isNamedReducer = true;
  return namedReducer;
};

export const TARGET_ALL_PARAMS = Symbol('target');

export const isParameterizedReducerState = state =>
  state && typeof state.params === 'object' && typeof state.data === 'object';

export const unwrapParameterizedReducerState = (state, paramKeyOrValues = null) => {
  if (isParameterizedReducerState(state)) {
    if (paramKeyOrValues === null) {
      return state.init;
    }

    const paramKey =
      typeof paramKeyOrValues === 'string'
        ? paramKeyOrValues
        : toParamKey(paramKeyOrValues, state.params);

    return state.data[paramKey] || state.init;
  }
  return state;
};
