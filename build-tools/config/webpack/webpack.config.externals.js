'use strict';
const nodeExternals = require('webpack-node-externals');

const createExternalsConfig = buildOption => {
  if (buildOption('target') === 'node') {
    return {
      externals: [
        nodeExternals({
          whitelist: buildOption('node-modules-externals-exclude', { merge: true }),
        }),
      ].concat(buildOption('externals', { merge: true })),
    };
  }

  return {
    externals: [].concat(buildOption('externals', { merge: true })),
  };
};

module.exports = createExternalsConfig;
