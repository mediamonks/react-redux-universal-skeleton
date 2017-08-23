/* eslint-disable */
const path = require('path');

/**
 * These options are used to build a webpack configuration for web development builds of
 * member. It overrides the default options defined in tools/config/buildoptions/default.buildoptions.js
 */
module.exports = {
  webOutputDirname: 'wwwroot',
  enableBrowserHotReload: true,
  useStyleLoader: true,
  enableReactHotLoader: true,
  createDllBundles: true,
  watchMode: true,
  failOnError: false,
  enableUglify: false,
  enableBabelCache: true,
  forceEnvironmentProduction: false,
  defineConstants: {
    development: true,
  },
  includePathInfo: true,
  sourcePath: path.join(__dirname, '../../../src'),
  sourceEntry: path.join(__dirname, '../../../src/client/client.js'),
  buildPath: path.join(__dirname, '../../../build'),
  target: 'web',
  version: 'static',
  serviceConfigJson: path.join(__dirname, '../config.json'),
};
