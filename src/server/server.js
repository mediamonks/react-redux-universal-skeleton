import 'source-map-support/register';
import hotReactServer from 'hot-callback-loader?export=default!./ReactServer';
import hotRoutes from 'hot-callback-loader?export=default!../common/components/Routes';
import hotReducer from 'hot-callback-loader?export=default!../common/reducers';
import HotReloader from './HotReloader';
import renderHooks from './renderHooks';

/**
 * Bootstraps the server.
 *
 * PLEASE NOTE: because this is the webpack entry file and we need to export this
 * function from the resulting build, we use 'module.exports = ' rather than the
 * ES6 'export default ...';
 *
 * @param {WebpackDevCompiler} [devCompiler?] An instance of WebpackDevCompiler, if
 * it is used. We will pass a created instance of ReactServer to the compiler
 * so it send status updates to the server.
 * @param {boolean} [serverStaticFiles=false] If true, enables serving static files. For deployment
 * builds, .net will handle serving static assets from the build folder
 */
function server(devCompiler, serverStaticFiles = false) {
  let routesModule;
  let reducerModule;
  let reactServer;

  if (devCompiler && module.hot) {
    const hotReloader = new HotReloader();
    devCompiler.setHotReloader(hotReloader);
  }

  hotRoutes(Routes => {
    routesModule = Routes;
    reactServer && reactServer.setReactRoutes(routesModule);
  });
  hotReducer(reducer => {
    reducerModule = reducer;
    reactServer && reactServer.setReduxReducer(reducerModule);
  });

  hotReactServer(ReactServer => {
    if (reactServer) {
      reactServer.stop();
    }

    reactServer = new ReactServer({
      afterStoreHook: renderHooks,
    });
    reactServer.setReactRoutes(routesModule);
    reactServer.setReduxReducer(reducerModule);

    if (devCompiler) {
      devCompiler.mountDevMiddlewareOnApp(reactServer.app);

      // for the development server, enable serving static files.
      // for deployment builds, .net will handle serving static assets from the build folder.
      reactServer.serveStaticFiles();
    } else if (serverStaticFiles) {
      reactServer.serveStaticFiles();
      reactServer.serveBuildAssetFiles();
    }

    reactServer.start();
  });
}
module.exports = server;
