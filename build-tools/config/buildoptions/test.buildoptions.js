/* eslint-disable */
const path = require('path');

/**
 * These options are used to build a webpack configuration for web development builds of
 * member. It overrides the default options defined in tools/config/buildoptions/default.buildoptions.js
 */
module.exports = {
  webOutputDirname: 'wwwroot',
  enableBrowserHotReload: false,
  useStyleLoader: true,
  enableReactHotLoader: false,
  createDllBundles: false,
  watchMode: false,
  failOnError: false,
  enableUglify: false,
  enableBabelCache: false,
  forceEnvironmentProduction: false,
  defineConstants: {
    development: true,
  },
  includePathInfo: false,
  sourcePath: path.join(__dirname, '../../../src'),
  sourceEntry: path.join(__dirname, '../../../src/client/client.js'),
  buildPath: path.join(__dirname, '../../../build'),
  target: 'web',
  version: 'static',
  serviceConfigJson: path.join(__dirname, '../config.json'),
  test: true,
};
