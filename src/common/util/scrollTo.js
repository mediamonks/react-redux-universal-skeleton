/* global WP_DEFINE_IS_NODE */

/**
 * simple wrapper for scroll-to module that will not include the module server-side
 *
 * @module scrollTo
 * @category templating, browsers
 */

let scrollTo = () => {}; // eslint-disable-line import/no-mutable-exports

if (!WP_DEFINE_IS_NODE) {
  scrollTo = require('scroll-to'); // eslint-disable-line global-require
}

export default scrollTo;
