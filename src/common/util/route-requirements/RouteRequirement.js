/* global WP_DEFINE_DEVELOPMENT */

class RouteRequirement {
  /**
   * A helper class to define a requirement that is needed to enter a route. Instances of this
   * class can be passed to Route components using the `requirements` prop
   *
   * @constructor
   * @param {string} name A name used for debugging purposes
   * @param {Array<RouteRequirement>} childRequirements An array of other RouteRequirement
   * instances. The child requirements will always be checked before this one.
   * @param {function} test A function that checks if the requirement is met.
   * Receives the following parameters:
   *  - `getState` The redux getState function
   *  - `renderProps` the renderProps returned by react router based on the current route
   * Can return a boolean that indicates if the requirement is met, or a Promise that resolves
   * with a boolean.
   * @param {function} onFail A function that will be executed when the requirement is not met.
   * Receives the following parameters:
   *  - `state` The redux getState function
   *  - `renderProps` the renderProps returned by react router based on the current route
   *  - `callbacks` An object with these properties:
   *      + `redirect(path)` A function that will redirect to the given path
   *      + `redirectToLogin()` A function that will redirect to the login endpoint
   * @category routing
   */
  constructor(name, childRequirements, test, onFail) {
    this.childRequirements = childRequirements;
    this.test = test;
    this.onFail = onFail;
    this.name = name;

    if (WP_DEFINE_DEVELOPMENT) {
      if (!Array.isArray(childRequirements)) {
        throw new TypeError('Expected childRequirements to be an Array');
      }
      childRequirements.forEach(child => {
        if (!(child instanceof RouteRequirement)) {
          throw new TypeError(
            'Elements in childRequirements should be instanceof RouteRequirement',
          );
        }
      });
      if (typeof test !== 'function') {
        throw new TypeError(`Expected typeof test to be "function" but got "${typeof test}"`);
      }
      if (typeof onFail !== 'function') {
        throw new TypeError(`Expected typeof onFail to be "function" but got "${typeof onFail}"`);
      }
    }
  }
}

export default RouteRequirement;
