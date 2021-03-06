/* eslint-disable */
const webOptions = require('./buildoptions/web-dist.buildoptions');
const createWebpackConfig = require('./webpack/webpack.config');
const BuildOptionsManager = require('./buildoptions/BuildOptionsManager');

const version = Math.round(+new Date() / 1000).toString(10);

const webBuildOptionsManager = new BuildOptionsManager();
webBuildOptionsManager.injectValues(webOptions);
webBuildOptionsManager.injectValues({
  version: version,
});

module.exports = createWebpackConfig(webBuildOptionsManager);
