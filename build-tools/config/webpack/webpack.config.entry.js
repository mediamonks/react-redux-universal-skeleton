'use strict';
const createEntryConfig = buildOption => {
  const isTargetNode = buildOption('target') === 'node';
  const entryName = isTargetNode ? 'server' : 'client';
  return {
    entry: Object.assign(
      {
        [entryName]: [].concat(
          isTargetNode ? ['source-map-support/register'] : [],
          ['babel-polyfill'],
          isTargetNode ? [] : ['svgxuse', 'src/client/browserDetect.js'],
          !isTargetNode && buildOption('enable-react-hot-loader') ? ['react-hot-loader/patch'] : [],
          [buildOption('source-entry', { isPath: true })],
          !isTargetNode && buildOption('enable-browser-hot-reload')
            ? ['webpack-hot-middleware/client']
            : [],
        ),
      },
      isTargetNode
        ? {
            'asset-cleanup': 'build-tools/asset-cleanup.js',
          }
        : {},
    ),
  };
};

module.exports = createEntryConfig;
