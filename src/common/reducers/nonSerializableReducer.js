import { handleActions } from 'redux-actions';
import { createSelector } from 'reselect';
import {
  CLEAR_NON_SERIALIZABLE,
  REGISTER_NON_SERIALIZABLE,
} from '../actions/nonSerializableActions';

let idCount = 0;
const nonSerializable = {};

const nonSerializableNamespaceReducer = handleActions(
  {
    [REGISTER_NON_SERIALIZABLE]: (state, { payload: { key, value } }) => {
      const id = ++idCount; // eslint-disable-line no-plusplus
      nonSerializable[id] = value;

      return {
        ...state,
        [key]: id,
      };
    },
    [CLEAR_NON_SERIALIZABLE]: (state, { payload: { key } }) => {
      if (state[key]) {
        delete nonSerializable[state[key]];
      }

      const { [key]: toDelete, ...newState } = state; // eslint-disable-line no-unused-vars

      return newState;
    },
  },
  {},
);

/**
 * Reducer to store global non-serializable per-user state.
 *
 * Use this to store global non-serializable state that should **not** be shared between
 * different users on a Node.JS node. If the state can be shared between users (like an instance
 * of a utility class) use the `injector.js` logic instead.
 *
 * This state **will not** be shared between server and client. When the state is serialized
 * to send to the client, this state will be stripped. If you want an instance to be available
 * on the server and the client, you will need to register a separate instance with this
 * reducer on both sides.
 */
const nonSerializableReducer = (state = {}, action) => {
  switch (action.type) {
    case REGISTER_NON_SERIALIZABLE:
    case CLEAR_NON_SERIALIZABLE:
      return {
        ...state,
        [action.payload.namespace]: nonSerializableNamespaceReducer(
          state[action.payload.namespace],
          action,
        ),
      };
    default:
      return state;
  }
};

/**
 * Returns a new selector that returns looks up a piece of non serializable state
 * @param {string} [namespace='default'] The namespace where the state should be looked
 * up. Only required if one was given in `registerNonSerializable`
 * @example const promiseSelector = makeNonSerializableSelector('promises');
 * const myPromise = promiseSelector(state.nonSerializable, { key: 'getHeaderContent' });
 */
export const makeNonSerializableSelector = (namespace = 'default') =>
  createSelector(
    (state, { key }) => state[namespace] && state[namespace][key],
    id => id && nonSerializable[id],
  );

export default nonSerializableReducer;
