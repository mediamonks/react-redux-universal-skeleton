'use strict';
const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

require('./webpack-dev-compiler/patch-debug-env-var');

const webpackConfig = require('./config/webpack.config.dist');
const compiler = webpack(webpackConfig);

console.log('Running build...');
compiler.run(function(err, stats) {
  if (err) {
    console.error('Error during build: \n' + err);
  } else if (stats.hasErrors()) {
    const statsErrors = stats.toString('errors-only');

    console.error('Error during node compile: \n');
    console.error(statsErrors);
  } else {
    console.log(stats.toString('normal'));
    const server = require('../build/node/server.js');
    server(null, true);
  }
});
