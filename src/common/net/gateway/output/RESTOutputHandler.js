/* eslint-disable class-methods-use-this */

import { stringify as queryStringify } from 'query-string';

/**
 * Formats the data according to the MediaMonks REST API spec, where the action is appended to
 * the base-url.
 */
class RESTOutputHandler {
  /**
   * @param {string} action
   * @param {any} data
   * @param {IGatewayOptions} options
   * @returns {any} data
   */
  format(action, data, options) {
    /* eslint-disable no-param-reassign */
    options.url += action;

    if (options.params) {
      options.url += options.url.indexOf('?') >= 0 ? '&' : '?';
      options.url += queryStringify(options.params);
    }

    // make headers optional
    options.headers = options.headers || {};
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
    /* eslint-disable no-param-reassign */

    return options;
  }
}

export default RESTOutputHandler;
