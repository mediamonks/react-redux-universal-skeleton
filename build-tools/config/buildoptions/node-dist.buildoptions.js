/* eslint-disable */
const path = require('path');

/**
 * These options are used to build a webpack configuration for NodeJS deployment builds of
 * member. It overrides the default options defined in tools/config/buildoptions/default.buildoptions.js
 */
module.exports = {
  webOutputDirname: 'wwwroot',
  enableBrowserHotReload: false,
  watchMode: false,
  failOnError: true,
  enableUglify: false,
  enableBabelCache: false,
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
    {
      from: path.join(__dirname, '../../../config'),
      to: '../config',
    },
    {
      from: path.join(__dirname, '../../../package.json'),
      to: '../package.json',
    },
    {
      from: path.join(__dirname, '../../../yarn.lock'),
      to: '../yarn.lock',
    },
  ],
  defineConstants: {
    development: false,
  },
  includePathInfo: false,
  sourceEntry: path.join(__dirname, '../../../src/server/server.js'),
  sourcePath: path.join(__dirname, '../../../src'),
  buildPath: path.join(__dirname, '../../../build'),
  target: 'node',
  serviceConfigJson: path.join(__dirname, '../config.json'),
};
