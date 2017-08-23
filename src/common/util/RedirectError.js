/** @module */

class RedirectError extends Error {
  /**
   * A special Error type that can be used inside prepare functions of components. When thrown
   * inside a prepare function, it will be caught and cause a redirect. On the server, this redirect
   * will be a 302. On the client, this redirect will be a pushState (__and might execute after
   * component render__).
   *
   * @constructor
   * @param {string} path The path to redirect to
   * @param {string} [message] A message to set on the Error. If not given, will add a default
   * message
   * @category routing
   */
  constructor(path, message) {
    super(message || `page should redirect to "${path}"`);

    this.path = path;
  }
}

export default RedirectError;
