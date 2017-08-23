/* eslint-disable */
const path = require('path');

/**
 * These options are used to build a webpack configuration for web distribution builds of
 * member. It overrides the default options defined in tools/config/buildoptions/default.buildoptions.js
 */
module.exports = {
  webOutputDirname: 'wwwroot',
  enableBrowserHotReload: false,
  watchMode: false,
  failOnError: true,
  enableUglify: true,
  imageOptimization: true,
  enableBabelCache: false,
  forceEnvironmentProduction: true,
  defineConstants: {
    development: false,
  },
  includePathInfo: false,
  sourcePath: path.join(__dirname, '../../../src'),
  sourceEntry: path.join(__dirname, '../../../src/client/client.js'),
  buildPath: path.join(__dirname, '../../../build'),
  target: 'web',
  serviceConfigJson: path.join(__dirname, '../config.json'),
};
