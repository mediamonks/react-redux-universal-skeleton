/*
 * This file contains definitions for configuration values. It does not contain the configuration
 * values itself. However, when webpack encounters an import to this file, it will replace the
 * contents of this file with the configuration values injected into webpack at build-time.
 * In this process, webpack will validate the configuration values against the validation functions
 * provided here.
 *
 * PLEASE NOTE: As this file is parsed at build time, only valid Node 6.0 syntax can be used. Some
 * ES6 syntax should be avoided as this file will not be pre-processed by babel.
 */
const validation = require('../../../build-tools/config/buildoptions/validation');

module.exports = {
  id: 'redux',
  persistKeys: validation.isArrayOf(validation.isString),
  useRavenMiddleware: validation.isBoolean,
};
