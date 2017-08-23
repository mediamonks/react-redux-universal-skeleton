/* eslint-disable */
const autoprefixer = require('autoprefixer');

module.exports = function(ctx) {
  const plugins = [
    autoprefixer( {browsers: ['last 4 iOS versions', 'last 4 versions', 'ie >= 9']} )
  ];

  return {
    plugins: plugins
  };
};
