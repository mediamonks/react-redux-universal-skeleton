import { isAsyncAction } from '../../util/asyncActionMiddleware';

const asyncAction = (state = {}, action) => {
  if (action.meta.isFulfilled) {
    if (action.meta.asyncId === state.id) {
      return {
        ...state,
        isFulfilled: action.meta.isFulfilled,
        error: !!action.error,
      };
    }
    return state;
  }
  return {
    id: action.meta.asyncId,
    isFulfilled: false,
    error: false,
  };
};

const asyncActions = (state = [], action) => {
  if (action && isAsyncAction(action)) {
    if (action.meta.isFulfilled) {
      const newState = state.map(a => asyncAction(a, action));

      // If all actions have been fulfilled, clear the currently running actions
      if (newState.every(a => a.isFulfilled)) {
        return [];
      }
      return newState;
    }
    return [...state, asyncAction(undefined, action)];
  }
  return state;
};

export default asyncActions;
