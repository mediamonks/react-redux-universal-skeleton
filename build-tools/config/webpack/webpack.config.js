'use strict';
const path = require('path');
const BuildOptionsManager = require('../buildoptions/BuildOptionsManager');

function createConfiguration(buildOptionsManager) {
  const buildOption = buildOptionsManager.getValue.bind(buildOptionsManager);

  buildOptionsManager.forbidOptionCombination(
    {
      'enable-browser-hot-reload': true,
      'watch-mode': false,
    },
    'Configuration flag "enable-browser-hot-reload" can only be used in combination with "watch-mode"',
  );
  buildOptionsManager.forbidOptionCombination(
    {
      'fail-on-error': true,
      'watch-mode': true,
    },
    'Configuration flag "fail-on-error" should not be used in combination with "watch-mode"',
  );
  buildOptionsManager.forbidOptionCombination(
    {
      'enable-uglify': true,
      target: 'node',
    },
    'Configuration flag "enable-uglify" should not be used on target === "node"',
  );
  buildOptionsManager.forbidOptionCombination(
    {
      'force-environment-production': true,
      target: 'node',
    },
    'Configuration flag "force-environment-production" should not be used on target === "node"',
  );

  const config = Object.assign(
    {
      target: buildOption('target'),
      watch: buildOption('watch-mode'),
      bail: buildOption('fail-on-error'),
      devtool: buildOption('devtool'),
      node: {
        __dirname: false,
        __filename: false,
      },
    },
    require('./webpack.config.entry')(buildOption),
    require('./webpack.config.output')(buildOption),
    require('./webpack.config.resolve')(buildOption),
    require('./webpack.config.externals')(buildOption),
    require('./webpack.config.module')(buildOption),
    require('./webpack.config.plugins')(buildOption),
  );

  return config;
}

module.exports = createConfiguration;
