import { handleActions } from 'redux-actions';
import debugLib from 'debug';

const debug = debugLib('React:asyncReducer');

export const resolved = 'resolved';
export const rejected = 'rejected';
export const pending = 'pending';

/** @module */

/**
 * Creates an async action handler with a signature as used in redux-actions:
 * (state, action) => newState
 * It will respond to different async states of the action, based on the passed
 * configuration object.
 * @function createAsyncActionHandler
 * @param {Object} asyncConfig The async configuration object
 * @param {function} [asyncConfig.pending] The action handler to be called when
 * the action is a pending (not resolved or rejected) action
 * @param {function} [asyncConfig.rejected] The action handler to be called when
 * the action is a rejected action
 * @param {function} [asyncConfig.resolved] The action handler to be called when
 * the action is a resolved action
 * @returns {function} The action handler
 */
export const createAsyncActionHandler = asyncConfig => (state, action) => {
  if (action.meta.isAsync) {
    if (action.error) {
      return asyncConfig.rejected ? asyncConfig.rejected(state, action) : state;
    } else if (action.meta.isFulfilled) {
      return asyncConfig.resolved ? asyncConfig.resolved(state, action) : state;
    }
    return asyncConfig.pending ? asyncConfig.pending(state, action) : state;
  }

  debug('Async action handler ignored action with no isAsync property on meta');
  return state;
};

/**
 * Enhanced version of the
 * {@link https://github.com/acdlite/redux-actions#handleactionsreducermap-defaultstate|redux-actions handleActions}
 * utility. It has the same API as the handleActions function, but allows for async action handlers
 * in the reducerMap parameter. Instead of passing a callback function for a specific action type,
 * an object can be passed with callback functions for each stage of an asynchronous action.
 * For more info, see
 * {@link module:app/util/asyncReducer~createAsyncActionHandler|createAsyncActionHandler}
 * or the example below.
 *
 * @function handleActionsAsync
 * @param {object} reducerMap The reducer map config
 * @param defaultState The default state for the reducer. See the
 * {@link https://github.com/acdlite/redux-actions#handleactionsreducermap-defaultstate|redux-actions handleActions}
 * docs for more info.
 * @returns {function} The resulting reducer function
 * @example handleActionsAsync({
 *   // regular handleActions syntax is still supported
 *   INCREMENT: (state, action) => ({
 *     counter: state.counter + action.payload
 *   }),
 *   // asynchronous action
 *   GET_ARTICLES: {
 *     pending: (state) => ({ ...state, articlesLoading: true }),
 *     resolved: (state) => ({
 *       ...state,
 *       articlesLoading: false,
 *       articles: action.payload.articles,
 *     }),
 *   },
 * }, { counter: 0, articlesLoading: false, articles: []});
 */
export const handleActionsAsync = (reducerMap, defaultState) => {
  const patchedReducerMap = { ...reducerMap };

  Object.keys(patchedReducerMap).forEach(actionType => {
    if (typeof patchedReducerMap[actionType] === 'object') {
      patchedReducerMap[actionType] = createAsyncActionHandler(patchedReducerMap[actionType]);
    }
  });

  return handleActions(patchedReducerMap, defaultState);
};
