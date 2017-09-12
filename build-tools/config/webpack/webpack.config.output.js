'use strict';
const path = require('path');

const createOutputConfig = buildOption => {
  const isTargetNode = buildOption('target') === 'node';
  const buildTargetSubdirs = isTargetNode
    ? [buildOption('node-output-dirname')]
    : [buildOption('web-output-dirname'), buildOption('assets-dirname')];

  return {
    output: Object.assign(
      {
        path: path.join(buildOption('build-path'), ...buildTargetSubdirs),
        filename: isTargetNode ? '[name].js' : '[name].[hash].js',
      },
      {
        publicPath: buildOption('public-web-root') + buildOption('assets-dirname') + '/',
      },
      isTargetNode ? { libraryTarget: 'commonjs2' } : {},
      buildOption('include-path-info') ? { pathinfo: true } : {}
    ),
  };
};

module.exports = createOutputConfig;
