/* global WP_DEFINE_IS_NODE */

import Promise from 'es6-promise';
import extend from 'extend';
import debugLib from 'debug';
import qs from 'qs';

import CachedCall from './CachedCall';

const debug = debugLib('React:Gateway');

let fetchPonyfill = null;
if (!WP_DEFINE_IS_NODE) {
  fetchPonyfill = require('fetch-ponyfill')({}); // eslint-disable-line global-require
}
let btoaNode = null;
if (WP_DEFINE_IS_NODE) {
  btoaNode = require('btoa'); // eslint-disable-line global-require
}

/**
 * Calls a function that can return a promise, and wait for the result
 * We are currently not interested in the result, only if we need to wait
 *
 * @private
 * @param fn
 * @param args
 * @return {*}
 */
const callHook = (fn, args) => {
  // don't fail, just continue
  if (!fn) {
    return Promise.resolve();
  }

  // call function
  const result = fn(...args);

  // if promise is returned, return the promise to wait for
  if (result && typeof result.then === 'function') {
    return result;
  }

  // else, return a resolved promise
  return Promise.resolve();
};

// enum type, internal usage
const Method = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
};

/**
 * The Gateway class is used to communicate to the backend.
 *
 * The Gateway uses isomorphic-fetch to execute the XHR requests, so both client and server usage
 * is supported.
 *
 * Setup
 * -----
 * The Gateway is created like this:
 *
 * ```
 * this.gateway = new Gateway({
 *      // the base url
 *      url: 'http://www.example.com/api/v1/',
 *      mode: 'cors', // cors, no-cors, or same-origin
 *      // can be changed to other handles to support different kind of communication structures
 *      outputHandler: new RESTOutputHandler(),
 *      inputHandler: new RESTInputHandler(),
 *      // can be used to capture errors that happen on each request, and log them somewhere
 *      onError(error) {
 *        captureError(error);
 *      },
 *      // allows you to alter the request before it is sent, useful for things that rely on
 *      // 'global state', that you don't want to pass along in each request
 *      // e.g. adding auth headers
 *      beforeRequest(options) {
 *        return options;
 *      },
 * }, true);
 * ```
 *
 * You can pass any of the following options for global configuration:
 * - url      // the base url for all requests, the request url will be appended here
 * - onError  // can be used to capture errors that happen on each request, and log them somewhere
 * - beforeRequest  // allows you to alter the request before it is sent, useful for things that
 *                  // rely on 'global state', that you don't want to pass along in each request
 *                  // e.g. adding auth headers
 *
 * In addition you can set defaults for the normal request options used in the fetch api:
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
 *
 * The options passed into the Gateway constructor are merged with the options that can be passed
 * for each request.
 *
 * Examples
 * -------
 * ```
 * // normal get request
 * gatewayInstance.get('/subscription-packages/')
 *   .then(response => console.log(response));
 *
 * // when needing to add cookies, using the options
 * gatewayInstance.get('/antiforgery/', null, { credentials: 'include' })
 *   .then(response => console.log(response));
 *
 * // when sending data and adding extra headers
 * gatewayInstance.post('/accounts/', data, {
 *     headers: { 'X-XSRF-Token': response.data },
 *     credentials: 'include',
 *   })
 *   .then(response => console.log(response));
 * ```
 */
class Gateway {
  runningCalls = {};
  cachedCalls = {};
  options = {};

  /**
   * @constructor
   * @param {object} options Extends the fetch init options object, this will be merged
   * with the same options object that can be specified per call, and passed to fetch when a
   * request is done.
   */
  constructor(options) {
    this.setOptions(options);
  }

  /**
   * Returns the passed options
   *
   * @returns {Object}
   */
  getOptions() {
    return this.options;
  }

  /**
   * Sets global options
   *
   * Gateway defaults are managed here
   *
   * @param options {Object} global gateway options
   */
  setOptions(options) {
    this.options = extend(
      this.options,
      {
        mode: 'same-origin', // cors, no-cors, or same-origin
        redirect: 'follow', // follow, error, or manual
        credentials: 'omit', // omit, same-origin, or include
      },
      options,
    );

    if (options && !this.options.outputHandler) {
      debug('missing property outputHandler in Gateway options, falling back to default behavior');
    }
  }

  /**
   * GET shorthand for the execute method
   *
   * @param {string} action
   * @param {any} data
   * @param {Object} options_
   */
  get(action, data = null, options_ = {}) {
    const options = extend(true, { method: Method.GET }, this.options, options_);
    options.cacheKey =
      options.cacheKey ||
      options.jsonpCallback ||
      options.url + action + (btoaNode || btoa)(JSON.stringify(data));

    // ignore duplicate calls
    if (this.runningCalls[options.cacheKey]) {
      debug(`duplicate call: ${options.cacheKey}`);
      return this.runningCalls[options.cacheKey];
    }

    // check cached call
    const p = this.checkCachedCall(options);
    if (p) {
      debug(`result '${action}' coming from cache!`);
      return p;
    }

    // TODO: do this cleaner
    if (data) {
      action += `?${qs.stringify(data)}`; // eslint-disable-line no-param-reassign
    }

    return this.execute(action, null, options);
  }

  /**
   * POST shorthand for the execute method
   *
   * @param {string} action
   * @param {any} data
   * @param {IGatewayCallOptions} options_
   * @return {Promise} A IGatewayResult<any> Promise
   */
  post(action, data, options_) {
    const options = extend(true, { method: Method.POST }, this.options, options_);

    return this.execute(action, data, options);
  }

  /**
   * PUT shorthand for the execute method
   *
   * @param {string} action
   * @param {any} data
   * @param {Object} options_
   * @return {Promise} A IGatewayResult<any> Promise
   */
  put(action, data, options_) {
    const options = extend(true, { method: Method.PUT }, this.options, options_);

    return this.execute(action, data, options);
  }

  /**
   * PATCH shorthand for the execute method
   *
   * @param {string} action
   * @param {any} data
   * @param {Object} options_
   * @return {Promise} A IGatewayResult<any> Promise
   */
  patch(action, data, options_) {
    const options = extend(true, { method: Method.PATCH }, this.options, options_);

    return this.execute(action, data, options);
  }

  /**
   * DELETE shorthand for the execute method
   *
   * @param {string} action
   * @param {any} data
   * @param {Object} options_
   * @return {Promise} A IGatewayResult<any> Promise
   */
  delete(action, data = null, options_) {
    const options = extend(true, { method: Method.DELETE }, this.options, options_);

    return this.execute(action, data, options);
  }

  /**
   * Executes the gateway request
   *
   * @param {string} action
   * @param {any} data
   * @param {Object} options_
   * @return {Promise} A IGatewayResult<any> Promise
   */
  execute(action, data = {}, options_) {
    debug(`execute: ${action}, ${data}`);

    // for when this method was called directly
    let options = extend(true, {}, this.options, options_);

    // missing url
    if (!this.options.url) {
      throw new Error('missing property url in Gateway options');
    }

    // missing request method
    if (!options.method) {
      throw new Error("Missing HTTP request method, please provide via the 'options.method'");
    }

    // replace {var} in the url with data.var or options.var, or {action} with the passed action.
    options.url = options.url.replace(/\{([^}]+)\}/gi, (result, match) => {
      if (match === 'action') {
        return action;
      }
      return data[match] || options[match] || match;
    });

    // format data
    if (options.outputHandler) {
      options = options.outputHandler.format(action, data, options);
    } else {
      options.body = data;
    }

    debug(`options: ${options}`);

    return callHook(options.beforeRequest, [options]).then(() => this.doRequest(options));
  }

  doRequest(options) {
    // get info in error log
    let savedResponseText;
    let responseObj;

    const { url, method, mode, redirect, body, headers, credentials } = options;

    // https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
    const p = ((fetchPonyfill && fetchPonyfill.fetch) || fetch)(url, {
      method,
      mode,
      redirect,
      body,
      headers,
      credentials,
    })
      .then(response => {
        debug(`response: ${options.url}, ${response.status}`);
        responseObj = response;

        // no content
        if (response.status === 204) {
          return '';
        }

        // error without body
        if (response.status < 200 || response.status >= 500) {
          throw new Error(`API responded with statusCode ${response.status} for ${url}`);
        }

        // parse as text and convert to json manually
        // this way we can use the text in error logging
        // when it's not valid json
        return response.text().then(responseText => {
          // save for later
          savedResponseText = responseText;

          const json = JSON.parse(responseText);

          // error with body, which should be returned in the result
          if (response.status >= 400) {
            // since this is the 'error' case, make sure this
            // ends up in the error handling part of the code
            throw json;
          }

          // all is fine, 200-300 range
          return json;
        });
      })
      //
      // executed when there is a error response (manual error)
      // or when something happens processing the response (runtime error)
      .catch(e => {
        debug(`error: ${url}`);
        console.error('Error while processing API response: ', e); // eslint-disable-line no-console

        let result;
        // turn runtime errors into gateway-shaped errors
        if (e instanceof Error) {
          result = {
            error: {
              code: 'error',
              error: e.message,
              stack: e.stack,
            },
          };
        } else {
          result = e;
        }

        delete this.runningCalls[options.cacheKey];

        // report error to the global error handler
        // could be used for logging or reporting to Sentry
        options.onError &&
          options.onError({
            request: options,
            response: {
              status: responseObj ? responseObj.status : 0,
              text: savedResponseText || '',
            },
            error: result,
          });

        // throw the result object so it will end up in the
        // catch handler of the calling promise
        throw result;
      })
      //
      // when everything went fine, do some final logic before returning
      // the response to the calling function
      .then(responseData => {
        delete this.runningCalls[options.cacheKey];

        // store result in cache when appropriate
        if (options.method === Method.GET && options.cacheMaxAge) {
          this.cachedCalls[options.cacheKey] = new CachedCall(
            options.cacheKey,
            JSON.stringify(responseData), // don't store as ref
            options.cacheMaxAge,
          );
        }

        return responseData;
      });

    // log call as running
    this.runningCalls[options.cacheKey] = p;

    return p;
  }

  /**
   * Checks if there is a cached call that can be returned instead of doing an actual request.
   *
   * @private
   * @param {Object} options
   * @returns {any}
   */
  checkCachedCall(options) {
    if (this.cachedCalls[options.cacheKey]) {
      const cc = this.cachedCalls[options.cacheKey];

      // cache is expired, invalidate cache
      if (cc.isExpired()) {
        delete this.cachedCalls[options.cacheKey];
      } else {
        // we hit the cache, return the cached response asynchronously
        return new Promise(resolve => {
          resolve(JSON.parse(cc.result));
        });
      }
    }

    return null;
  }
}

export default Gateway;
