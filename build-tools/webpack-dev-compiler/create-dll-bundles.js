const Promise = require('es6-promise').Promise;
const path = require('path');
const checksum = require('checksum');
const webpack = require('webpack');
const fs = require('fs');

const packages = [
  'babel-polyfill',
  'redux',
  'redux-form',
  'redux-thunk',
  'redux-actions',
  'reselect',
  'moment',
  'react',
  'react-dom',
  'react-redux',
  'react-router',
  'react-router-redux',
  'react-hot-loader',
  'react-addons-css-transition-group',
  'lodash',
  'fetch-ponyfill',
  'config',
  'classnames',
  'debug',
  'raven-js',
];

module.exports = function(devtool) {
  return new Promise(function(resolve, reject) {
    checksum.file(path.resolve(__dirname, '../../package.json'), function(checksumError, checksum) {
      if (checksumError) {
        reject(new Error('Could not create checksum from package.json: \n' + checksumError));
        return;
      }

      let shouldUpdate = true;

      const dllBundlesDir = path.join(__dirname, 'dll-bundles');
      if (!fs.existsSync(dllBundlesDir)) {
        fs.mkdirSync(dllBundlesDir);
      }

      const checksumPath = path.join(__dirname, 'dll-bundles/checksum.txt');
      try {
        fs.accessSync(checksumPath, fs.constants.R_OK);

        const prevChecksum = fs.readFileSync(checksumPath, { encoding: 'utf8' });
        if (prevChecksum === checksum) {
          shouldUpdate = false;
        }
      } catch (e) {
        // checksum file does not exist. do nothing
      }

      if (shouldUpdate) {
        console.log('package.json changed. Creating DLL bundles...');

        const dllWebpackConfig = {
          target: 'web',
          entry: {
            vendor: packages,
          },
          output: {
            filename: '[name].dll.js',
            path: path.join(__dirname, 'dll-bundles/'),
            library: '__[name]_dll_bundle',
            libraryTarget: 'var',
            pathinfo: true,
          },
          plugins: [
            new webpack.DllPlugin({
              path: path.join(__dirname, 'dll-bundles/[name]-manifest.json'),
              name: '__[name]_dll_bundle',
              context: path.join(__dirname, '../../'),
            }),
          ],
          devtool: devtool,
        };

        let compiler;
        try {
          compiler = webpack(dllWebpackConfig);
        } catch (e) {
          return reject(e);
        }

        compiler.run(function(err) {
          console.log('DLL bundles created');
          if (err) {
            reject(err);
          } else {
            fs.writeFileSync(checksumPath, checksum, { encoding: 'utf8' });
            resolve();
          }
        });
      } else {
        console.log('package.json unchanged. Using existing DLL bundle');
        resolve();
      }
    });
  });
};
