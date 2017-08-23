'use strict';
const AssetsPlugin = require('assets-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const webpack = require('webpack');
const UnusedFilesWebpackPlugin = require('unused-files-webpack-plugin').default;
const path = require('path');
const snakeCase = require('snake-case');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

// TODO: need to become more generic, maybe also for other variables
const replaceVersionInPath = (list, version) =>
  list.map(item => ({
    from: item.from.replace('{version}', version),
    to: item.to.replace('{version}', version),
  }));

const createPluginsConfig = buildOption => {
  const isTargetNode = buildOption('target') === 'node';

  return {
    plugins: [
      isTargetNode
        ? null
        : new AssetsPlugin({
            path: path.join(
              buildOption('build-path'),
              buildOption('node-output-dirname'),
              buildOption('asset-manifest-dirname') + '/',
            ),
            filename: buildOption('version') + '-assets-manifest.json',
          }),

      isTargetNode
        ? null
        : new ManifestPlugin({
            basePath: '/assets/',
            fileName: '../../node/manifests/' + buildOption('version') + '-webpack-manifest.json',
          }),

      (isTargetNode && buildOption('watch-mode')) || buildOption('enable-browser-hot-reload')
        ? new webpack.NoErrorsPlugin()
        : null,

      // We copy during node compilation, to make sure the static files are there before the
      // server initializes. However, the files are copied to the 'web' output folder because
      // they need to be publicly accessible.
      isTargetNode
        ? new CopyWebpackPlugin(
            [
              {
                from: path.join(__dirname, '../../../static/assets'),
                to:
                  '../' +
                  buildOption('web-output-dirname') +
                  '/' +
                  buildOption('versioning-dirname') +
                  '/' +
                  buildOption('version'),
              },
              {
                from: path.join(__dirname, '../../../static/public-root'),
                to: '../' + buildOption('web-output-dirname') + '/',
              },
              ...replaceVersionInPath(
                buildOption('copy-plugin-patterns', { merge: true }),
                buildOption('version'),
              ),
              ...(buildOption('create-dll-bundles')
                ? [
                    {
                      from: path.join(
                        __dirname,
                        '../../webpack-dev-compiler/dll-bundles/vendor.dll.js',
                      ),
                      to:
                        '../' +
                        buildOption('web-output-dirname') +
                        '/' +
                        buildOption('versioning-dirname') +
                        '/' +
                        buildOption('version') +
                        '/vendor.dll.js',
                    },
                  ]
                : []),
            ],
            { ignore: ['readme.md'] },
          )
        : null,

      buildOption('build-progress-handler') !== null
        ? new webpack.ProgressPlugin(buildOption('build-progress-handler'))
        : null,

      new ExtractTextPlugin({
        filename: buildOption('extract-stylesheet-name'),
        allChunks: true,
        disable: isTargetNode || buildOption('use-style-loader'),
      }),

      buildOption('enable-unused-file-warnings')
        ? new UnusedFilesWebpackPlugin({
            cwd: buildOption('source-path', { isPath: true }),
          })
        : null,

      (isTargetNode && buildOption('watch-mode')) || buildOption('enable-browser-hot-reload')
        ? new webpack.HotModuleReplacementPlugin()
        : null,

      buildOption('enable-browser-hot-reload') ? new webpack.NamedModulesPlugin() : null,

      buildOption('enable-uglify')
        ? new webpack.optimize.UglifyJsPlugin({
            mangle: false,
            sourceMap: true,
            warnings: false,
            compress: {
              keep_fnames: true,
            },
          })
        : null,

      buildOption('enable-uglify')
        ? new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false,
          })
        : null,

      new ImageminPlugin({
        disable: !buildOption('image-optimization'),
        gifsicle: null,
        svgo: null,
        pngquant: { quality: '65' },
      }),

      buildOption('create-dll-bundles') && !isTargetNode
        ? new webpack.DllReferencePlugin({
            context: path.join(__dirname, '../../../'),
            manifest: require('../../webpack-dev-compiler/dll-bundles/vendor-manifest.json'),
            name: '__vendor_dll_bundle',
            sourceType: 'var',
          })
        : null,
      new webpack.DefinePlugin(
        Object.assign(
          convertDefineConstantsNames(
            buildOption,
            Object.assign(
              {
                version: JSON.stringify(buildOption('version')),
                versioningDirname: JSON.stringify(buildOption('versioning-dirname')),
                webOutputDirname: JSON.stringify(buildOption('web-output-dirname')),
                nodeOutputDirname: JSON.stringify(buildOption('node-output-dirname')),
                versioningPath: JSON.stringify(
                  '/' + buildOption('versioning-dirname') + '/' + buildOption('version'),
                ),
                assetPath: JSON.stringify('/' + buildOption('assets-dirname')),
                assetsDirname: JSON.stringify(buildOption('assets-dirname')),
                publicPath: JSON.stringify(buildOption('public-web-root')),
                styleLoader: buildOption('use-style-loader'),
                enableReactHotLoader: buildOption('enable-react-hot-loader'),
                assetsJsonLocation: JSON.stringify(
                  './' +
                    buildOption('asset-manifest-dirname') +
                    '/' +
                    buildOption('version') +
                    '-assets-manifest.json',
                ),
                useDllBundles: buildOption('create-dll-bundles'),
                stylesheetFilename: JSON.stringify(buildOption('extract-stylesheet-name')),
                webEntryFilename: JSON.stringify('client.js'),
                isNode: isTargetNode,
              },
              buildOption('define-constants', { merge: true }),
            ),
          ),
          buildOption('force-environment-production')
            ? { 'process.env': { NODE_ENV: JSON.stringify('production') } }
            : {},
        ),
      ),
      new LodashModuleReplacementPlugin(),
    ].filter(plugin => plugin !== null),
  };
};

function convertDefineConstantsNames(buildOption, constants) {
  const result = {};
  const prefix = buildOption('defineConstantsPrefix');

  for (let i in constants) {
    if (constants.hasOwnProperty(i)) {
      result[prefix + snakeCase(i).toUpperCase()] = constants[i];
    }
  }

  return result;
}

module.exports = createPluginsConfig;
