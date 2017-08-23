/* eslint-disable */
var nodeOptions = require('./buildoptions/test.buildoptions');
var createWebpackConfig = require('./webpack/webpack.config');
var BuildOptionsManager = require('./buildoptions/BuildOptionsManager');

var version = Math.round(+new Date() / 1000).toString(10);

var nodeBuildOptionsManager = new BuildOptionsManager();
nodeBuildOptionsManager.injectValues(nodeOptions);
nodeBuildOptionsManager.injectValues({
  version: version,
});

module.exports = createWebpackConfig(nodeBuildOptionsManager);
