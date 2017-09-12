'use strict';

/**
 *  Entry script for the development server.
 *
 * Please note: This file is not parsed through webpack but directly executed by Node.JS
 */
const WebpackDevCompiler = require('./webpack-dev-compiler');
const webOptions = require('.//config/buildoptions/web-dev.buildoptions');
const nodeOptions = require('.//config/buildoptions/node-dev.buildoptions');
const nodeVersion = process.version.replace(/^[^0-9]+/, '');
const nodeMajorVersion = parseInt(nodeVersion[0], 10);
const argv = require('yargs').argv;

if (!argv['legacy-node'] && nodeMajorVersion < 8) {
  throw new Error(
    'You need at least NodeJS v6.0 to run this dev server. Current NodeJS version is ' +
      nodeMajorVersion
  );
}

const devCompiler = new WebpackDevCompiler(webOptions, nodeOptions);
devCompiler
  .start()
  .then(result => {
    // noinspection JSFileReference
    const serverBootstrap = require('../build/node/server');
    serverBootstrap(devCompiler);
  })
  .catch(e => {
    console.error(e);
  });
