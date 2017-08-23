const path = require('path');

/**
 * Separate webpack config file containing the static resolve configuration.
 * This is used by eslint-import-resolver-webpack as a webpack configuration file so it can
 * verify our imports.
 */
module.exports = () => ({
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.json'],
    modules: [path.join(__dirname, '../../../'), 'node_modules'],
  },
  resolveLoader: {},
});
