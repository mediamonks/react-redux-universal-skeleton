/* global WP_DEFINE_DEVELOPMENT, WP_DEFINE_VERSIONING_DIRNAME, WP_DEFINE_ASSETS_DIRNAME, WP_DEFINE_WEB_OUTPUT_DIRNAME, WP_DEFINE_PUBLIC_PATH */ // eslint-disable-line
import path from 'path';
import express, { Router as expressRouter } from 'express';
import debugLib from 'debug';
import responseTime from 'response-time';
import raven from 'raven';
import environmentConfig from 'config';
import addShutdown from 'http-shutdown';

import { createClientOnServer } from 'src/common/util/raven/raven-client';
import { enableDebugBreadcrumb } from 'src/common/util/raven/debug-breadcrumb';
// eslint-disable-next-line no-unused-vars

import hotPageRenderer from 'hot-callback-loader?export=default!./PageRenderer';
import 'expose-loader?fetch!imports-loader?this=>global!exports-loader?global.fetch!isomorphic-fetch';

import headersRoute from './routes/headers';
import serverConfig from './server.configdefinitions';

/* eslint-disable import/no-unresolved */
import buildInfo from '../../build-info.json';
import setRenderMode from './routes/setRenderMode';
/* eslint-enable */

const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// patch debug calls to add them as Raven breadcrumbs
enableDebugBreadcrumb();

/**
 * Server class that serves our app
 */
class ReactServer {
  httpServer = null;
  Routes = null;
  reduxReducer = null;
  running = false;

  /**
   * @param [afterStoreHook] {function} Will be called when the store is created, so you can
   * dispatch actions to add stuff in the store. Will pass the store as first parameter, and the
   * express request object as second.
   */
  constructor({ afterStoreHook = null }) {
    this.afterStoreHook = afterStoreHook;

    this.app = express();
    this.appRouter = expressRouter();
    this.debug = debugLib('React:ReactServer');
    this.ravenConfig = environmentConfig.get('raven').nodejs;

    if (serverConfig.useRaven && this.ravenConfig) {
      this.setupRaven();
    }

    hotPageRenderer(PageRenderer => {
      this.pageRenderer = new PageRenderer();
      this.pageRenderer.setReactRoutes(this.Routes);
      this.pageRenderer.setReduxReducer(this.reduxReducer);
    });
  }

  /**
   * Set the react-router configuration component that should be used to match incoming
   * requests.
   * @param Routes The react-router configuration component
   */
  setReactRoutes = Routes => {
    this.Routes = Routes;
    if (this.pageRenderer) {
      this.pageRenderer.setReactRoutes(Routes);
    }
  };

  /**
   * Sets the main reducer to be used when creating new store instances.
   * @param reduxReducer A redux reducer function
   */
  setReduxReducer = reduxReducer => {
    this.reduxReducer = reduxReducer;
    if (this.pageRenderer) {
      this.pageRenderer.setReduxReducer(reduxReducer);
    }
  };

  /**
   * All middleware that should be mounted before the regular routing should be added
   * before calling this function.
   */
  start() {
    if (this.running) {
      this.debug('Attempting to call start() on a ReactServer instance that is already running');
      return;
    }
    this.debug('Starting ReactServer');
    this.initMiddleware();
    this.running = true;
    this.listen();
  }

  /**
   * Setup middleware to log all requests through the debug module
   */
  logRequests() {
    this.app.use('/', (req, res, next) => {
      this.debug(`Request: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
      next();
    });
  }

  /**
   * Enables serving static files from the build folder.
   *
   * IMPORTANT: should only be called when running the development server. Once deployed,
   * IIS will handle serving static assets from the build dir.
   */
  serveStaticFiles() {
    /* eslint-disable no-unused-vars */

    // serve static files from versioning folder
    this.app.use(
      `/${WP_DEFINE_VERSIONING_DIRNAME}`,
      express.static(
        path.join(__dirname, `../${WP_DEFINE_WEB_OUTPUT_DIRNAME}/${WP_DEFINE_VERSIONING_DIRNAME}`),
      ),
    );
    // if requests to versioning folder are not handled by this point, respond 404
    this.app.use(`/${WP_DEFINE_VERSIONING_DIRNAME}`, (req, res, next) =>
      res.sendStatus(HTTP_NOT_FOUND),
    );

    // serve the favicon from the web root
    this.app.use('/favicon.ico', (req, res, next) =>
      res.sendFile(path.join(__dirname, `../${WP_DEFINE_WEB_OUTPUT_DIRNAME}/favicon.ico`)),
    );

    /* eslint-enable */
  }

  /**
   * Enables serving web assets from the build folder
   *
   * IMPORTANT: should only be called when running a dist build locally. Once deployed,
   * IIS will handle serving build assets
   */
  serveBuildAssetFiles() {
    /* eslint-disable no-unused-vars */

    // serve static files from versioning folder
    this.app.use(
      `/${WP_DEFINE_ASSETS_DIRNAME}`,
      express.static(
        path.join(__dirname, `../${WP_DEFINE_WEB_OUTPUT_DIRNAME}/${WP_DEFINE_ASSETS_DIRNAME}`),
      ),
    );
    // if requests to versioning folder are not handled by this point, respond 404
    this.app.use(`/${WP_DEFINE_ASSETS_DIRNAME}`, (req, res, next) =>
      res.sendStatus(HTTP_NOT_FOUND),
    );

    /* eslint-enable */
  }

  /**
   * Initializes the default routes and middleware for the server. Should only be called once.
   */
  initMiddleware() {
    this.setupHTTPSHeader();

    if (process.env.NODE_ENV !== 'production') {
      headersRoute(this.app);
      setRenderMode(this.app);
      this.app.use(responseTime());
    }
    this.logRequests();

    let afterStoreHook = this.afterStoreHook;

    this.appRouter.use('/', (req, res, next) => {
      // patch redirect to work with this mounted route
      const orgRedirect = res.redirect;
      /* eslint-disable no-param-reassign */
      res.redirect = (code, url) => {
        if (typeof code === 'string') {
          url = code;
          code = 302;
        }

        if (url.startsWith('/')) {
          url = req.baseUrl + url;
        }

        orgRedirect.call(res, code, url);
      };
      /* eslint-enable no-param-reassign */

      /* eslint-disable max-len */
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'localhost') {
        // TODO: find a better way to do this
        // here we can test Account API calls that are normally passed by Edge
        afterStoreHook = (store, req_) => {
          this.afterStoreHook && this.afterStoreHook(store, req_);
          if (typeof req.query.mock !== 'undefined') {
            try {
              this.debug(`Loading "${req.path}${req.query.mock ? `.${req.query.mock}` : ''}" mock`);
            } catch (error) {
              console.log(error); // eslint-disable-line no-console
              // ignore
            }
          }
        };
      }
      /* eslint-enable max-len */

      this.pageRenderer.handleRequest(req, res, next, {
        afterStoreHook,
      });
    });

    this.app.use(WP_DEFINE_PUBLIC_PATH || '/', this.appRouter);

    if (serverConfig.useRaven && this.ravenConfig) {
      this.setupRavenErrorHandler();
    }

    /* eslint-disable no-unused-vars */
    this.app.use((err, req, res, next) => {
      this.debug('Error during request: ');
      this.debug(err);
      res.sendStatus(HTTP_INTERNAL_SERVER_ERROR);
    });
    /* eslint-enable */
  }

  /**
   * Sets up raven for reporting NodeJS rendering issues to Sentry
   */
  setupRaven() {
    createClientOnServer(raven, this.ravenConfig, buildInfo);

    if (!this.useEdge) {
      this.app.use(raven.requestHandler());
    }
  }

  /**
   * Sets up raven error handling middleware for reporting NodeJS rendering issues to Sentry
   */
  setupRavenErrorHandler() {
    if (!this.useEdge) {
      this.app.use(raven.errorHandler());
    }
  }

  /**
   * If the header x-iisnode-https is set by iisnode, set the more standardized header
   * x-forwarded-proto
   */
  setupHTTPSHeader() {
    this.app.use('/', (req, res, next) => {
      if (req.headers['x-iisnode-https'] === 'on') {
        /* eslint-disable no-param-reassign */
        req.headers['x-forwarded-proto'] = 'https';
        /* eslint-enable */
      }
      next();
    });
  }

  /**
   * Helper function called when executing start(). Will cause express to start listening on
   * the configured port. All routes should be setup before calling this method.
   */
  listen() {
    this.port = process.env.PORT || serverConfig.port;
    this.httpServer = this.app.listen(this.port);
    if (WP_DEFINE_DEVELOPMENT) {
      addShutdown(this.httpServer);
    }
    this.debug(`listening on port ${this.port}`);
  }

  /**
   * Helper function called when executing stop(). Will close the currently running http server
   * so a new one can be started.
   */
  close() {
    if (this.httpServer) {
      this.debug(`closing http server at port ${this.port}`);
      if (WP_DEFINE_DEVELOPMENT) {
        this.httpServer.shutdown(() => this.debug('server closed using http-shutdown'));
      } else {
        this.httpServer.close(() => this.debug('server closed'));
      }
      this.httpServer = null;
    }
  }

  /**
   * Stops the currently running express instance
   */
  stop() {
    if (!this.running) {
      this.debug('Attempting to call stop() on a ReactServer instance that is' + ' not running');
      return;
    }
    this.close();
    this.running = false;
  }
}

export default ReactServer;
