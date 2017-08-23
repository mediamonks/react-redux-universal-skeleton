const BuildOptionsManager = require('../buildoptions/BuildOptionsManager');
const createWebpackConfig = require('../webpack/webpack.config');
const webOptions = require('../buildoptions/storybook.buildoptions');
const genDefaultConfig = require('@storybook/react/dist/server/config/defaults/webpack.config.js');

module.exports = (baseConfig, configType) => {
  const config = genDefaultConfig(baseConfig, configType);

  const webBuildOptionsManager = new BuildOptionsManager();
  webBuildOptionsManager.injectValues(webOptions);
  webBuildOptionsManager.injectValues({
    version: '',
  });

  const customConfig = createWebpackConfig(webBuildOptionsManager);
  customConfig.module.rules.forEach(rule => config.module.rules.push(rule));
  customConfig.resolve.modules.forEach(module => config.resolve.modules.push(module));

  return config;
};
