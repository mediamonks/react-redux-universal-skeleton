/**
 * Default webpack config options, set to run a deployment build
 *
 * TODO: the nodeOutputDirname and webOutputDirname values are used hardcoded in the copyPluginPatterns
 */
module.exports = {
  nodeOutputDirname: 'node',
  webOutputDirname: 'web',
  assetManifestDirname: 'manifests',
  enableBrowserHotReload: false,
  enableReactHotLoader: false,
  useStyleLoader: false,
  imageOptimization: false,
  createDllBundles: false,
  watchMode: false,
  outputDevToDisk: false,
  failOnError: true,
  enableUglify: true,
  nodeModulesExternalsExclude: [],
  copyPluginPatterns: [],
  externals: [],
  enableBabelCache: false,
  buildProgressHandler: null,
  extractStylesheetName: 'screen.[contenthash].css',
  enableUnusedFileWarnings: false,
  versioningDirname: 'version',
  assetsDirname: 'assets',
  forceEnvironmentProduction: true,
  defineConstantsPrefix: 'WP_DEFINE_',
  defineConstants: {
    development: false,
    useAuth: false,
  },
  includePathInfo: false,
  devtool: 'source-map',
  publicWebRoot: '/',
  legacyNode: false,
  storybook: false,
  test: false,
};
