'use strict';
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const sourceDirs = [
  path.resolve(__dirname, `../../../src`),
  path.resolve(__dirname, `../../../test`),
];

const getBabelLoader = buildOption => {
  return {
    loader: 'babel-loader',
    options: {
      presets:
        buildOption('target') === 'node' && !buildOption('legacy-node')
          ? ['node6', 'react']
          : [['es2015', { modules: false }], 'react'],
      plugins: [
        ...(buildOption('storybook')
          ? [['react-docgen', { DOC_GEN_COLLECTION_NAME: 'STORYBOOK_REACT_CLASSES' }]]
          : []),
        'lodash',
        'transform-runtime',
        'transform-class-display-name',
        'transform-class-properties',
        'transform-flow-strip-types',
        'transform-object-rest-spread',
        'transform-es2015-destructuring',
        'transform-es2015-parameters',
        'transform-strict-mode',
        ...(buildOption('test') ? ['istanbul'] : []),
        [
          'babel-plugin-transform-builtin-extend',
          {
            globals: ['Error', 'Array'],
          },
        ],
        ...(buildOption('enable-react-hot-loader') ? ['react-hot-loader/babel'] : []),
        // see notice at http://babeljs.io/docs/plugins/transform-object-rest-spread/
        ...((buildOption('target') === 'node' && !buildOption('legacy-node')) || buildOption('test')
          ? ['transform-es2015-destructuring', 'transform-es2015-parameters']
          : []),
      ],
      cacheDirectory: buildOption('enable-babel-cache') ? '' : false,
    },
  };
};

const getScssLoader = buildOption => {
  if (buildOption('target') === 'node') {
    return {
      test: /\.scss$/,
      use: 'null-loader',
    };
  }

  const scssLoaders = [
    {
      loader: 'css-loader',
      options: {
        sourceMap: true,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
      },
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: false,
        data: '@import "src/common/style/utils.scss";',
      },
    },
  ];

  if (buildOption('use-style-loader')) {
    scssLoaders.unshift({
      loader: 'style-loader',
      options: {
        sourceMap: true,
      },
    });
    return {
      test: /\.scss$/,
      use: scssLoaders,
    };
  }

  return {
    test: /\.scss$/,
    loader: ExtractTextPlugin.extract(scssLoaders),
  };
};

const createModuleConfig = buildOption => ({
  module: {
    rules: [
      getScssLoader(buildOption),
      {
        test: /\.configdefinitions\.js$/,
        use: [
          {
            loader: path.resolve(__dirname, '../../config-injector-loader'),
            options: {
              jsons: [buildOption('service-config-json', { isPath: true })],
            },
          },
        ],
      },
      {
        test: /.*[\/\\]([0-9]*[A-Z][^\\/\-]+)[\/\\]\1\.jsx?$/,
        use: [
          {
            loader: path.resolve(__dirname, '../../component-def-loader'),
          },
        ],
        include: sourceDirs,
        enforce: 'pre',
      },
      {
        test: /\.ts$/,
        include: sourceDirs,
        use: [
          getBabelLoader(buildOption),
          {
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: path.resolve(__dirname, '../../../tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.jsx?$/,
        include: sourceDirs,
        use: [getBabelLoader(buildOption)],
      },
      ...(buildOption('storybook')
        ? []
        : [
            {
              test: /\.(woff2?|ttf|eot)$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {
                    name: 'font/[name].[hash].[ext]',
                  },
                },
              ],
            },
            {
              test: /\.(svg|jpg|gif)$/,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    name: '[name].[hash].[ext]',
                    limit: 10000,
                  },
                },
              ],
            },
            {
              test: /\.png$/,
              use: [
                {
                  loader: 'url-loader',
                  options: {
                    name: '[name].[hash].[ext]',
                    limit: 10000,
                    mimetype: 'image/png',
                  },
                },
              ],
            },
          ]),
      ...(buildOption('enable-browser-hot-reload') && buildOption('enable-react-hot-loader')
        ? [
            {
              test: /Routes(?:[\/\\]index)?\.jsx?$/i,
              enforce: 'pre',
              include: sourceDirs,
              use: {
                loader: path.resolve(__dirname, '../../bundle-require-patch-loader'),
              },
            },
          ]
        : []),
    ],
  },
});

module.exports = createModuleConfig;
