'use strict';
require('./patch-debug-env-var');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const ProgressBar = require('progress');
const BuildOptionsManager = require('../config/buildoptions/BuildOptionsManager');
const createWebpackConfig = require('../config/webpack/webpack.config');
const express = require('express');
const path = require('path');
const debug = require('debug')('React:webpackDevCompiler');
const createDllBundles = require('./create-dll-bundles');
const Promise = require('es6-promise').Promise;

// patch ProgressBar until they release this function
ProgressBar.prototype.interrupt =
  ProgressBar.prototype.interrupt ||
  function(message) {
    // clear the current line
    this.stream.clearLine();
    // move the cursor to the start of the line
    this.stream.cursorTo(0);
    // write the message text
    this.stream.write(message);
    // terminate the line after writing the message
    this.stream.write('\n');
    // re-display the progress bar with its lastDraw
    this.stream.write(this.lastDraw);
  };

/**
 * IMPORTANT: Please note that this util is not built by webpack because it bootstraps
 * the webpack build.
 *
 * Starts a webpack build in watch mode for the node and web side of the application,
 * and bootstrap the application when ready
 * @param {object} webOptions An object of objects that will be passed tot the configuration
 * builder in the tools/config directory to compile the web side of the application
 * @param {object} nodeOptions An object of objects that will be passed tot the configuration
 * builder in the tools/config directory to compile the NodeJS side of the application
 */
function WebpackDevCompiler(webOptions, nodeOptions) {
  this.hotReloader = null;
  this.progressBar = null;
  this.nodeCompiler = null;
  this.webCompiler = null;
  this.devMiddlewareInstance = null;
  this.hotMiddlewareInstance = null;
  this.initialWebBuildReady = false;
  this.nodeIncrementalBuild = false;
  this.webIncrementalBuild = false;
  this.initialNodeBuildReady = false;
  this.outputWebToDisk = false;
  this.webpackConfigWeb = null;

  this.started = false;
  this.webOptions = webOptions;
  this.nodeOptions = nodeOptions;
  this.webBuildOptionsManager = new BuildOptionsManager();
  this.webBuildOptionsManager.injectValues(webOptions);
  this.nodeBuildOptionsManager = new BuildOptionsManager();
  this.nodeBuildOptionsManager.injectValues(nodeOptions);
}

WebpackDevCompiler.prototype.start = function() {
  if (this.started) {
    throw new Error('Cannot start WebpackDevCompiler: instance already started.');
  }
  this.started = true;

  this.checkOutputWebToDisk();
  return Promise.resolve()
    .then(this.createDllBundles.bind(this))
    .then(this.initProgressBar.bind(this))
    .then(this.startNodeBuild.bind(this))
    .then(this.startWebBuild.bind(this))
    .then(this.cleanupProgressBar.bind(this))
    .then(() => ({}))
    .catch(function(e) {
      console.error(e.message ? e.message : e);
      throw e;
    });
};

WebpackDevCompiler.prototype.checkOutputWebToDisk = function() {
  this.outputWebToDisk = !!this.webBuildOptionsManager.getValue('output-dev-to-disk');
  if (this.outputWebToDisk) {
    const overrideOptions = {
      enableBrowserHotReload: false,
      enableReactHotLoader: false,
    };
    debug(
      'output-dev-to-disk option enabled. Overriding the following options: ' +
        JSON.stringify(overrideOptions, null, '  ')
    );
    this.webBuildOptionsManager.injectValues(overrideOptions);
    this.nodeBuildOptionsManager.injectValues(overrideOptions);
  }
};

WebpackDevCompiler.prototype.cleanupProgressBar = function() {
  if (this.progressBar) {
    this.progressBar.terminate();
    this.progressBar = null;
  }
};

WebpackDevCompiler.prototype.initProgressBar = function() {
  this.progressBar = new ProgressBar('[:bar] :percent :message', {
    complete: 'S',
    incomplete: '-',
    width: 30,
    total: 100,
  });

  this.nodeBuildOptionsManager.injectValues({
    buildProgressHandler: this.getBuildProgressHandler('node'),
  });
  this.webBuildOptionsManager.injectValues({
    buildProgressHandler: this.getBuildProgressHandler('web'),
  });
};

WebpackDevCompiler.prototype.getBuildProgressHandler = function(target) {
  const devCompiler = this;
  return function(progress, msg) {
    const buildReady =
      target === 'web' ? devCompiler.initialWebBuildReady : devCompiler.initialNodeBuildReady;
    if (buildReady) {
      if (!devCompiler[target + 'IncrementalBuild']) {
        const logFunction = devCompiler.progressBar
          ? devCompiler.progressBar.interrupt.bind(devCompiler.progressBar)
          : debug;

        logFunction('Change in ' + target + ' source files detected. Recompiling...');
        devCompiler[target + 'IncrementalBuild'] = true;
      }
    } else if (devCompiler.progressBar) {
      const netProgress = progress / 2 + (target === 'web' ? 0.5 : 0);
      devCompiler.progressBar.update(netProgress, {
        message: 'building ' + target + ' (' + msg + ')',
        stream: process.stdout,
      });
    }
  };
};

WebpackDevCompiler.prototype.startNodeBuild = function() {
  const devCompiler = this;
  return new Promise(function(resolve) {
    const webpackConfigNode = createWebpackConfig(devCompiler.nodeBuildOptionsManager);
    devCompiler.nodeCompiler = webpack(webpackConfigNode);

    devCompiler.nodeCompiler.watch(
      {
        aggregateTimeout: 300,
        poll: false,
      },
      function(err, stats) {
        if (err) {
          console.error('Error during node compile: \n' + err);
          debug(devCompiler.initialNodeBuildReady ? 'Updates not applied!' : 'Server not started!');
        } else if (stats.hasErrors()) {
          const statsErrors = stats.toString('errors-only');

          console.error('Error during node compile: \n');
          console.error(statsErrors);
          debug(devCompiler.initialNodeBuildReady ? 'Updates not applied!' : 'Server not started!');
        } else {
          devCompiler.nodeIncrementalBuild = false;
          if (devCompiler.initialNodeBuildReady) {
            const logFunction = devCompiler.progressBar
              ? devCompiler.progressBar.interrupt.bind(devCompiler.progressBar)
              : debug;

            logFunction('Incremental node build completed');

            if (devCompiler.hotReloader) {
              devCompiler.hotReloader.checkUpdates();
            }
          } else {
            devCompiler.initialNodeBuildReady = true;
            resolve();
          }
        }
      }
    );
  });
};

WebpackDevCompiler.prototype.startWebBuild = function() {
  this.webpackConfigWeb = createWebpackConfig(this.webBuildOptionsManager);
  this.webCompiler = webpack(this.webpackConfigWeb);

  return this.outputWebToDisk ? this.startWebBuildToDisk() : this.startWebBuildToMemory();
};

WebpackDevCompiler.prototype.startWebBuildToDisk = function() {
  const devCompiler = this;

  return new Promise(function(resolve) {
    devCompiler.webCompiler.watch(
      {
        aggregateTimeout: 300,
        poll: false,
      },
      function(err, stats) {
        if (err) {
          console.error('Error during web compile: \n' + err);
          debug(devCompiler.initialWebBuildReady ? 'Updates not applied!' : 'Server not started!');
        } else if (stats.hasErrors()) {
          const statsErrors = stats.toString('errors-only');

          console.error('Error during web compile: \n');
          console.error(statsErrors);
          debug(devCompiler.initialWebBuildReady ? 'Updates not applied!' : 'Server not started!');
        } else {
          devCompiler.webIncrementalBuild = false;
          if (devCompiler.initialWebBuildReady) {
            debug('Incremental web build completed');
          } else {
            devCompiler.initialWebBuildReady = true;
            resolve();
          }
        }
      }
    );
  });
};

WebpackDevCompiler.prototype.startWebBuildToMemory = function() {
  const devCompiler = this;

  return new Promise(function(resolve) {
    devCompiler.devMiddlewareInstance = webpackDevMiddleware(devCompiler.webCompiler, {
      publicPath: devCompiler.webpackConfigWeb.output.publicPath,
      noInfo: true,
      watchOptions: {
        aggregateTimeout: 300,
        poll: false,
      },
      stats: 'minimal',
    });

    if (devCompiler.webOptions.enableBrowserHotReload) {
      devCompiler.hotMiddlewareInstance = webpackHotMiddleware(devCompiler.webCompiler);
    }

    devCompiler.devMiddlewareInstance.waitUntilValid(resolve);
  });
};

WebpackDevCompiler.prototype.createDllBundles = function() {
  if (this.webOptions.createDllBundles) {
    return createDllBundles(this.webOptions.devtool);
  }

  return Promise.resolve();
};

WebpackDevCompiler.prototype.setHotReloader = function(hotReloader) {
  this.hotReloader = hotReloader;
};

WebpackDevCompiler.prototype.mountDevMiddlewareOnApp = function(app) {
  if (!this.webToDisk) {
    app.use(this.devMiddlewareInstance);
    if (this.hotMiddlewareInstance) {
      app.use(this.hotMiddlewareInstance);
    }
  }
};

module.exports = WebpackDevCompiler;
