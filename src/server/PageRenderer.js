/* global WP_DEFINE_DEVELOPMENT, WP_DEFINE_ASSETS_JSON_LOCATION */
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { match, RouterContext, createMemoryHistory } from 'react-router';
import { prepareComponents, setInitMode, MODE_INIT_SELF } from 'react-redux-component-init';
import { syncHistoryWithStore } from 'react-router-redux';
import { Provider } from 'react-redux';
import debugLib from 'debug';
import config from 'config';
import React from 'react';
import promisify from 'es6-promisify';
import fs from 'fs';
import path from 'path';
import qs from 'qs';
import hotHtml from 'hot-callback-loader?export=default!./components/Html';
import createStoreInstance from './util/createStoreInstance';
import serverConfig from './server.configdefinitions';
import processQueryRouting from '../common/util/QueryRouting/processQueryRouting';
import secureReduxState from './util/secureReduxState';
import setupInjects from '../common/util/setupInjects';
import parseRouteRequirements from '../common/util/route-requirements/parseRouteRequirements';
import processRequirements from '../common/util/route-requirements/processRequirements';

/* eslint-disable import/no-unresolved */
import buildInfo from '../../build-info.json';
import RedirectError from '../common/util/RedirectError';
import getProtocol from '../common/util/getProtocol';
import { getError, hasErrors } from '../common/reducers/errorReducer';
import RenderMode from '../common/data/enum/RenderMode';
/* eslint-enable */

const debug = debugLib('React:PageRenderer');
const matchPromisified = promisify(match, { multiArgs: true });
const HTTP_MOVED_TEMPORARILY = 302;

const getComponentForRoute = (nextState, route) => {
  if (route.component || route.components) {
    return Promise.resolve(route.component);
  }
  const getComponent = route.getComponent;
  if (getComponent) {
    return new Promise(resolve => {
      // eslint-disable-line consistent-return
      const componentReturn = getComponent.call(route, nextState, (err, component) => {
        resolve(component);
      });
      if (componentReturn && componentReturn.then && typeof componentReturn.then === 'function') {
        return componentReturn.then((err, component) => resolve(component)).catch(() => resolve());
      }
    });
  }

  return Promise.resolve();
};

const getPageComponents = (renderProps, routes) =>
  Promise.all(
    routes.map(route => route.component || getComponentForRoute(renderProps, route)),
  ).then(components => components.filter(_ => _));

class InterruptRenderError extends Error {}

/**
 * Helper class that pre-renders markup for a given route.
 */
class PageRenderer {
  Routes = null;
  reduxReducer = null;
  assetsManifest = null;

  constructor() {
    hotHtml(Html => {
      this.Html = Html;
    });

    setupInjects(JSON.parse(JSON.stringify(config)));
  }

  /**
   * Returns the parsed assets manifest that outputs during the web build. On development,
   * we will read the assets json file on every call. Otherwise, this object will be cached.
   *
   * @returns {object}
   */
  getAssetsManifest = () => {
    if (!this.assetsManifest || WP_DEFINE_DEVELOPMENT) {
      // when testing the account-edge version, we could only be running node, so we don't have
      // the json on file.
      try {
        const assetsFile = fs.readFileSync(path.join(__dirname, WP_DEFINE_ASSETS_JSON_LOCATION));
        this.assetsManifest = JSON.parse(assetsFile);
      } catch (error) {
        // when on development/local, and there is no assets json, provide a dummy version
        if (
          !process.env.NODE_ENV ||
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'localhost'
        ) {
          this.assetsManifest = {
            client: {
              js: '',
              css: '',
            },
          };
        } else {
          throw error;
        }
      }
    }

    return this.assetsManifest;
  };

  /**
   * Set the react-router configuration component that should be used to match incoming
   * requests.
   * @param Routes The react-router configuration component
   */
  setReactRoutes = Routes => {
    this.Routes = processQueryRouting(Routes);
  };

  /**
   * Sets the main reducer to be used when creating new store instances.
   * @param reducer A redux reducer function
   */
  setReduxReducer = reducer => {
    this.reduxReducer = reducer;
  };

  /**
   * Handles incoming request from the express app. Will match the requested route using
   * react-router and if a match has been found, render the markup for that route and
   * respond it back to the client.
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {function} next The express next callback
   * @param {Object} options Options object
   * @param {AuthenticationHelper} [options.authHelper=null] If authentication is enabled for this
   * server, an instance of AuthenticationHelper will be passed so authentication can be performed
   * on routes that require login
   * @param {function} [options.afterStoreHook=null] Optional hook function that is called after
   * the store is created, so it can dispatch actions or subscribe to changes from outside this
   * function. The store will be passed as the first and only parameter to the hook function.
   */
  handleRequest(req, res, next, { authHelper = null, afterStoreHook = null } = {}) {
    let store;
    let renderProps;
    let redirectLocation;
    let memoryHistory;
    let allRoutes;

    Promise.resolve()
      .then(() => this.matchRoutes(req))
      .then(matchRoutesResult => {
        ({ redirectLocation, renderProps } = matchRoutesResult);
        debug(`Route matching complete for ${req.url}`);

        if (redirectLocation) {
          debug(
            `react-router matched a redirect. Redirecting to ${redirectLocation.pathname}${redirectLocation.search}`,
          );
          res.redirect(
            HTTP_MOVED_TEMPORARILY,
            `${redirectLocation.pathname}${redirectLocation.search}`,
          );
          throw new InterruptRenderError();
        }

        if (!renderProps) {
          debug("react-router didn't match any route. Showing a server 404");
          res.sendStatus(404);
          throw new InterruptRenderError();
        }

        memoryHistory = createMemoryHistory(req.url);
        store = createStoreInstance(this.reduxReducer, req.cookies, memoryHistory);
        syncHistoryWithStore(memoryHistory, store);

        if (afterStoreHook) {
          afterStoreHook(store, req);
        }
      })
      .then(() => this.matchQueryRouting(renderProps))
      .then(({ queryRoutingResults, queryRoutingConfigs, routeQueryParams }) => {
        // Loop through all query routing (for loop so we can return)
        queryRoutingResults.forEach(([queryRedirect, queryRenderProps], index) => {
          const paramName = routeQueryParams[index];
          const queryRoute = queryRoutingConfigs[paramName];
          const queryValue = req.query[paramName];

          // If the query result is a redirect, perform a redirect in express
          if (queryRedirect) {
            debug(
              `react-router matched a redirect on query ${paramName}=${queryValue}. Redirecting query to ${queryRedirect.pathname}`,
            );
            const newQuery = qs.stringify({ ...req.query, [paramName]: queryRedirect.pathname });
            res.redirect(HTTP_MOVED_TEMPORARILY, `${req.path}?${newQuery}`);
            throw new InterruptRenderError();
          }

          // Update routing result in the render props. This causes the view to update accordingly
          queryRoute.renderProps = queryRenderProps || null;
        });

        // store the combination of the main routes and query routes
        // we'll need this later
        allRoutes = [
          ...renderProps.routes,
          ...queryRoutingResults.reduce(
            (queryRoutes, [, { routes }]) => queryRoutes.concat(routes),
            [],
          ),
        ];

        const allRoutingResults = [
          { renderProps, queryParam: null },
          ...queryRoutingResults.map(([, queryRenderProps], index) => ({
            renderProps: queryRenderProps,
            queryParam: routeQueryParams[index],
          })),
        ];

        return allRoutingResults.reduce(
          (last, { renderProps: currentRenderProps, queryParam }) =>
            last.then(result => {
              if (!result) {
                return false;
              }

              const routeRequirements = parseRouteRequirements(currentRenderProps.routes);
              debug(
                `Processing routeRequirements for ${queryParam
                  ? `queryParam "${queryParam}"`
                  : 'main routing'}`,
              );

              return processRequirements(routeRequirements, store.getState, currentRenderProps, {
                redirect: location => {
                  if (queryParam) {
                    const newQuery = qs.stringify({
                      ...req.query,
                      [queryParam]: location,
                    });
                    res.redirect(`${req.path}?${newQuery}`);
                  } else {
                    res.redirect(location);
                  }
                },
                redirectToLogin: () => {
                  authHelper.redirectToLogin(req, res);
                },
              });
            }),
          Promise.resolve(true),
        );
      })
      .then(meetsRequirements => {
        if (!meetsRequirements) {
          throw new InterruptRenderError();
        }

        // TODO: This only handles 404 status code, do we also want to handle other types?
        // TODO: 'public' will use a catch-all route for content, should check for API errors here
        if (renderProps.routes && renderProps.routes.some(({ status }) => status === 404)) {
          res.status(404);
        }

        const renderMode = store.getState().config.renderMode;

        debug(`Rendering on ${renderMode}`);
        if (renderMode === RenderMode.CLIENT) {
          // set the initMode. We normally do this on the client but we do this early because we're
          // skipping the server render
          store.dispatch(setInitMode(MODE_INIT_SELF));
          // Render markup without content
          return this.renderMarkup(req, null, secureReduxState(store.getState()));
        }

        // renderMode is server. Initialize page components
        return getPageComponents(renderProps, allRoutes)
          .then(components => store.dispatch(prepareComponents(components, renderProps)))
          .then(() => {
            // get the state that is used to render React markup
            const stateBeforeRender = store.getState();

            // render everything
            const contentMarkup = renderToString(
              <Provider store={store}>
                <RouterContext {...renderProps} />
              </Provider>,
            );

            // output actual HTML with rendered content and current server state
            return this.renderMarkup(req, contentMarkup, secureReduxState(stateBeforeRender));
          });
      })
      .then(markup => {
        debug('Markup rendered. Sending response...');

        // When global errors are in the state, output status code
        if (hasErrors(store.getState().error)) {
          const error = getError(store.getState().error);
          res.status(error.statusCode || 500);
        }

        if (typeof serverConfig.maxAge !== 'undefined') {
          res.set({
            'Cache-Control': `public, max-age=${serverConfig.maxAge}`,
          });
        }

        res.set({
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': "frame-ancestors 'self'",
          'X-Frame-Options': 'SAMEORIGIN',
        });

        debug('sending markup');
        res.send(`<!DOCTYPE html>${markup}`);
      })
      .catch(e => {
        if (e instanceof InterruptRenderError) {
          debug('InterruptRenderError thrown. Stopping further render actions.');
        } else if (e instanceof RedirectError) {
          debug(`RedirectError thrown. Redirecting request to "${e.path}"`);
          res.redirect(e.path);
        } else {
          next(e);
        }
      });
  }

  /**
   * Perform route matching on all the query parameters of the current location that
   * have been configured using <QueryRouting>
   * @param renderProps The renderProps result of the main route match
   * @returns Promise<Array>
   */
  matchQueryRouting = renderProps => {
    // lookup all <QueryRouting> config on the current route
    const queryRoutingConfigs = {};
    if (renderProps) {
      renderProps.routes.forEach(route => {
        if (route.queryRoutes) {
          Object.keys(route.queryRoutes).forEach(queryRoutDef => {
            queryRoutingConfigs[queryRoutDef] = route.queryRoutes[queryRoutDef];
          });
        }
      });
    }

    // reset all query routing match results to null
    Object.keys(queryRoutingConfigs).forEach(queryParam => {
      queryRoutingConfigs[queryParam].renderProps = null;
    });

    // get the query string from the main route matching result
    const queryParams = renderProps ? renderProps.location.query : {};

    // find all current query params that have <QueryRouting /> config
    const routeQueryParams = Object.keys(queryParams).filter(
      queryParam => !!queryRoutingConfigs[queryParam],
    );

    // run route matching for all query params
    return Promise.all(
      routeQueryParams.map(queryParam =>
        matchPromisified({
          routes: queryRoutingConfigs[queryParam].routes,
          location: queryParams[queryParam],
        }),
      ),
    ).then(queryRoutingResults => ({
      queryRoutingResults,
      queryRoutingConfigs,
      routeQueryParams,
    }));
  };

  /**
   * Renders the Html component and returns it as a string of HTML markup.
   * @param contentMarkup If provided, will render the given content inside the main container
   * of the Html component.
   */
  renderMarkup = (req, contentMarkup = null, reduxState = null) => {
    const assetsManifest = this.getAssetsManifest();
    const mainBundleAssets = assetsManifest.client;

    // get the host from the config corresponding to the microservice we are running
    const host = config.get('web.host').replace(/https?:\/\//gi, '');
    const protocol = getProtocol(req);

    // Please note: trailing slash is stripped from canonical url
    const canonical = `${protocol}://${host}${(req.originalUrl || req.url).replace(/\/$/, '')}`;

    // only index SEO when on production url
    const indexSEO = process.env.NODE_ENV === 'production' && !req.headers.host.includes('origin');

    return renderToStaticMarkup(
      <this.Html
        markup={contentMarkup}
        buildInfo={buildInfo}
        reduxState={reduxState}
        mainBundleAssets={mainBundleAssets}
        scripts={[]}
        canonical={canonical}
        indexSEO={indexSEO}
      />,
    );
  };

  /**
   * Performs a react-router match() call against the incoming express request
   * @param req The express request object
   * @returns {Promise} A Promise that resolves with the result of the call as an object with
   * redirectLocation and renderProps properties.
   */
  matchRoutes = req =>
    matchPromisified({
      routes: this.Routes,
      location: req.url,
    }).then(([redirectLocation, renderProps]) => ({ redirectLocation, renderProps }));
}

export default PageRenderer;
