/* global WP_DEFINE_DEVELOPMENT */
const values = {};

/**
 * @module Injector
 */

/**
 * Save a value under a key for later use.
 *
 * This is used as a way to store and access global dependencies, without hard references to
 * specific files at the place they are used. This gives the option to swap out the dependencies
 * with other in a single place, without affecting other code. It's a very basic form of Dependency
 * Injection.
 *
 * Currently the values are set in the `app/util/setupInjects.js` function that is called when
 * bootstrapping the app.
 *
 * @function setValue
 * @param key {string} Use a key from `app/data/Injectables.js`
 * @param value {any} The value to store
 */
export const setValue = (key, value) => {
  values[key] = value;
};

/**
 * Retrieve a stored value
 *
 * The benefit of using this, instead of directly requiring a global file, is that you remove the
 * hard link between them. Stored values are configured in a single place, so dependencies can be
 * swapped out easily. Also, when requiring global modules, you have no control over the
 * 'construction' time.
 *
 * @function getValue
 * @param key {string} Use a key from `app/data/Injectables.js`
 * @returns {any} The stored value
 */
export const getValue = key => {
  if (WP_DEFINE_DEVELOPMENT) {
    if (!(key in values)) {
      throw new ReferenceError(`[Injector] Injectable "${key}" has never been configured`);
    }
  }

  return values[key];
};
