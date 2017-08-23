import { createAction } from 'redux-actions';

export const REGISTER_NON_SERIALIZABLE = 'nonSerializableActions/REGISTER_NON_SERIALIZABLE';
export const CLEAR_NON_SERIALIZABLE = 'nonSerializableActions/CLEAR_NON_SERIALIZABLE';

/**
 * Registers a non-serializable object in the redux state. The state will contain
 * a reference to the given value, and the value itself will be stored in a static object.
 *
 * Use this to store global non-serializable state that should **not** be shared between
 * different users on a Node.JS node. If the state can be shared between users (like an instance
 * of a utility class) use the `injector.js` logic instead.
 *
 * This value **will not** be shared between server and client. When the state is serialized
 * to send to the client, this value will be stripped. If you store an instance here that is also
 * needed on the client, you will need to create a separate instance on the client.
 *
 * @param {string} key The key to store this value under. You can use this key to retrieve
 * the value again.
 * @param {any} value The value to store
 * @param {string} [namespace='default'] An optional namespace to prevent keys from different
 * types of values to overlap.
 */
export const registerNonSerializable = createAction(
  REGISTER_NON_SERIALIZABLE,
  (key, value, namespace = 'default') => ({ key, value, namespace }),
);

/**
 * Clears a non serializable value stored with `registerNonSerializable`
 * @param {string} key The key the value was stored under
 * @param {string} [namespace='default'] The namespace this value was stored under
 */
export const clearNonSerializable = createAction(
  CLEAR_NON_SERIALIZABLE,
  (key, namespace = 'default') => ({ key, namespace }),
);
