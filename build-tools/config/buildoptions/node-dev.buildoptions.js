/* eslint-disable */
const path = require('path');

/**
 * These options are used to build a webpack configuration for NodeJS development builds of
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
  externals: [
    function(context, request, callback) {
      if (/loadMock/.test(request)) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    },
  ],
  forceEnvironmentProduction: false,
  copyPluginPatterns: [
    {
      from: path.join(__dirname, '../../../static/assets'),
      to: '../wwwroot/version/{version}/',
    },
    {
      from: path.join(__dirname, '../../../static/public-root'),
      to: '../wwwroot/',
    },
  ],
  defineConstants: {
    development: true,
  },
  includePathInfo: true,
  sourceEntry: path.join(__dirname, '../../../src/server/server.js'),
  sourcePath: path.join(__dirname, '../../../src'),
  buildPath: path.join(__dirname, '../../../build'),
  target: 'node',
  version: 'static',
  serviceConfigJson: path.join(__dirname, '../config.json'),
};
