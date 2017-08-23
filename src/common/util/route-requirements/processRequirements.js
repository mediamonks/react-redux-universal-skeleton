/* global WP_DEFINE_DEVELOPMENT */
import debugLib from 'debug';
import RouteRequirement from './RouteRequirement';

const debug = debugLib('React:processRequirements');

/** @module */

/**
 * Checks each of the given requirements to see if they are met, and calls their `onFail`
 * handler otherwise. If any of the requirements fail, it will not process further requirements.
 *
 * @param requirements An array of route requirements, as returned by the
 * {@link parseRouteRequirements} util.
 * @param getState The redux getState function
 * @param renderProps The current render props returned by react-router
 * @param callbacks An object containing callbacks that a {@link RouteRequirement} instance can
 * execute in its `onFail` handler. Should include the following callbacks:
 *  - `redirect(path)` A function that will redirect to the given path
 *  - `redirectToLogin()` A function that will redirect to the login endpoint
 * @returns {Promise} A promise that resolve with a boolean indicating if all requirements are
 * met. If this is false, we should abort rendering of the current page.
 * @category routing
 */
function processRequirements(requirements, getState, renderProps, callbacks) {
  if (WP_DEFINE_DEVELOPMENT) {
    if (!Array.isArray(requirements)) {
      throw new TypeError('Expected requirements to be an Array');
    }
    requirements.forEach(requirement => {
      if (!(requirement instanceof RouteRequirement)) {
        throw new TypeError('Elements in requirements should be instanceof RouteRequirement');
      }
    });
  }

  return requirements.reduce(
    (prevRequirement, requirement) =>
      prevRequirement.then(meetsRequirements => {
        if (!meetsRequirements) return false;

        debug(`Processing route requirement "${requirement.name}"`);
        return Promise.resolve(requirement.test(getState, renderProps)).then(requirementOk => {
          if (!requirementOk) {
            debug(`Route requirement "${requirement.name}" failed. Calling onFail callback.`);
            requirement.onFail(getState, renderProps, callbacks);
          } else {
            debug(`Route requirement "${requirement.name}" passed`);
          }
          return requirementOk;
        });
      }),
    Promise.resolve(true),
  );
}

export default processRequirements;
