/* global WP_DEFINE_ENABLE_REACT_HOT_LOADER, WP_DEFINE_DEVELOPMENT, WP_DEFINE_PUBLIC_PATH */
import React from 'react';
import { syncHistoryWithStore } from 'react-router-redux';
import { useRouterHistory, match, RouterContext } from 'react-router';
import { createHistory } from 'history';
import { setInitMode, MODE_INIT_SELF } from 'react-redux-component-init';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import Raven from 'raven-js';
import promisify from 'es6-promisify';
import debugLib from 'debug';
import { configureRavenOnClient } from '../common/util/raven/raven-client';
import processQueryRouting from '../common/util/QueryRouting/processQueryRouting';

import clientConfig from './client.configdefinitions';

import parseRouteRequirements from '../common/util/route-requirements/parseRouteRequirements';
import processRequirements from '../common/util/route-requirements/processRequirements';
import createStoreInstance from './util/createStoreInstance';
import setupInjects from '../common/util/setupInjects';
import patchLocalStorageDebug from './util/patchLocalStorageDebug';
import RenderMode from '../common/data/enum/RenderMode';
import RedirectError from '../common/util/RedirectError';

const debug = debugLib('React:Client');
const matchPromisified = promisify(match, { multiArgs: true });

// Conditionally load AppContainer from react-hot-loader, if it's enabled.
let AppContainer;
if (WP_DEFINE_ENABLE_REACT_HOT_LOADER) {
  // eslint-disable-next-line global-require
  AppContainer = require('react-hot-loader').AppContainer;
}
if (!WP_DEFINE_ENABLE_REACT_HOT_LOADER) {
  AppContainer = ({ children }) => children;
}

if (WP_DEFINE_DEVELOPMENT) {
  patchLocalStorageDebug();
}

/**
 * Custom error type to abort the Promise chain of renderPage() when no further rendering
 * is desired.
 */
class InterruptRenderError extends Error {}

class ReactClient {
  /**
   * The react-router configuration. Passed in from outside for HMR purposes.
   */
  Routes = null;
  /**
   * The react-router config processed with processQueryRouting(). This is the configuration
   * that is used for main route matching
   */
  processedRoutes = null;
  /**
   * Instance of the Redux store. Created as soon as the routing config and reducers
   * are passed
   */
  store = null;
  /**
   * Main history (browerHistory) instance. Created as soon as the routing config and reducers
   * are passed
   */
  history = null;
  /**
   * Boolean indicating if the first client-side render has already been started.
   * @type {boolean}
   */
  firstRenderStarted = false;
  /**
   * HTML element the application will be mounted on. Set in the init() method
   */
  mountNode = null;
  /**
   * Boolean to detect and pre
   * @type {boolean}
   */
  renderInProgress = false;
  /**
   * Setup function(s) for redux-listeners-middleware. Is passed in from the outside because this
   * differs per microservice
   * @type {function|function[]}
   */
  reduxListenersSetup = [];

  /**
   * Bootstraps the client. Should be called after the react router config and reducers are
   * passed in.
   */
  init() {
    if (!this.store || !this.Routes) {
      throw new Error('Cannot initialize Client. Routes and reducer have not yet been passed.');
    }

    this.mountNode = document.getElementById('app');
    if (!this.mountNode) {
      throw new Error('Cannot find mount node to render application.');
    }

    const { environmentConfig } = this.store.getState().config;

    if (clientConfig.useRaven) {
      configureRavenOnClient(Raven, environmentConfig.raven.client, window.buildInfo);
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    this.history.listen(this.renderPage);
    this.renderPage();
  }

  /**
   * Will match the current route using react-router and re-render the page. Called
   * on initialization, on history change and on HMR hot update.
   */
  renderPage = () => {
    const { renderMode } = this.store.getState().config;
    const isServerRendered = renderMode === RenderMode.SERVER && !this.firstRenderStarted;
    let mainRenderProps;

    if (this.renderInProgress) {
      debug(
        'WARNING: renderPage() called while a page render was already in progress. This is likely due to a duplicate client-side history push. Aborted page rendering.',
      );
      return;
    }

    this.renderInProgress = true;
    this.firstRenderStarted = true;

    matchPromisified({ history: this.history, routes: this.processedRoutes })
      .then(([redirect, renderProps]) => {
        if (redirect) {
          this.renderInProgress = false;
          this.history.replace(redirect);
          throw new InterruptRenderError();
        }

        mainRenderProps = renderProps;

        if (!renderProps) {
          throw new Error(
            'No route matched. Please attach a catch-all 404 route to prevent this error.',
          );
        }

        return this.matchQueryRouting(renderProps);
      })
      .then(this.processQueryRouteMatching)
      .then(queryRoutingResults => {
        if (isServerRendered) {
          debug('Rendering page pre-rendered by server');

          // Route requirements already handled by server. Resolve with 'true'
          return true;
        }
        debug('Rendering page on Client');

        return this.processRouteRequirements([
          { renderProps: mainRenderProps, history: this.history },
          ...queryRoutingResults,
        ]);
      })
      .then(meetsRequirements => {
        if (!meetsRequirements) {
          debug('route requirements not met. stopping page render.');
          throw new InterruptRenderError();
        }

        debug('route requirements met. Rendering page.');

        render(
          <AppContainer>
            <Provider store={this.store}>
              <RouterContext {...mainRenderProps} />
            </Provider>
          </AppContainer>,
          this.mountNode,
        );

        this.store.dispatch(setInitMode(MODE_INIT_SELF));
        this.renderInProgress = false;
      })
      .catch(error => {
        this.renderInProgress = false;

        if (error instanceof InterruptRenderError) {
          debug('InterruptRenderError thrown. Stopping further render actions.');
        } else if (error instanceof RedirectError) {
          debug(`RedirectError thrown. Redirecting request to "${error.path}"`);
          this.history.redirect(error.path);
        } else {
          debug(`Error during route matching: ${error.message}`);
          throw error;
        }
      });
  };

  /**
   * Run processRequirements for the routeRequirements configured for the current routes
   * of the main routing and each of the routes for the query routing (if any)
   * @param {Array} allRoutingResults The routing results, starting with the main routing
   * and any query routing afterwards.
   * @param {Object} allRoutingResults[].history The history instance that controls this
   * routing. Instance of browserHistory for the main history, memoryHistory for all query
   * routing.
   * @param {Object} allRoutingResults[].renderProps The renderProps that resulted from the
   * react-router match() call for this routing
   * @param {string} [allRoutingResults[].queryParam] The name of the query param this route
   * matching is for. If it is the main routing, this is omitted.
   * @returns {Promise<boolean>|boolean} A boolean or Promise that resolves with a boolean that
   * indicates if rendering should continue or if it should be aborted.
   */
  processRouteRequirements = allRoutingResults =>
    allRoutingResults.reduce(
      (last, { renderProps, history, queryParam }) =>
        last.then(result => {
          if (!result) {
            // previous route requirements failed. Abort.
            return false;
          }

          const routeRequirements = parseRouteRequirements(renderProps.routes);
          debug(
            `Processing routeRequirements for ${queryParam
              ? `queryParam "${queryParam}"`
              : 'main routing'}`,
          );

          return processRequirements(routeRequirements, this.store.getState, renderProps, {
            // the redirect function redirects the main history or the query routing history,
            // depending on which requirements we are testing
            redirect: location => {
              this.renderInProgress = false;
              return history.push(location);
            },
          });
        }),
      Promise.resolve(true),
    );

  /**
   * Processes the query routing results
   *
   *  - Updates the memoryHistory of the query routing to match any changes in the query route
   *  - Performs a redirect on the main routing if one of the routes returned a redirect
   *  - Stores the routing results on the routing config object so it can be read by
   *    QueryRoutingContainer
   *
   * @param {object} results The resolved value of matchQueryRouting()
   * @param {Array<Array>} results.queryRoutingResults An array of return values of the routing
   * match() call for each query routing
   * @param {Object} results.queryRoutingConfigs An object containing all query routing configs
   * which are scoped under the current route, mapped by parameter name
   * @param {Array<string>} results.routeQueryParams All query parameter names which are in the
   * current query string and have configuration for query routing
   * @param {Object} results.queryParams All query params as parsed by the react-router match()
   * call
   * @returns {Array} array of { renderProps, history, queryParm } for each query
   */
  processQueryRouteMatching = results => {
    const { queryRoutingResults, queryRoutingConfigs, routeQueryParams, queryParams } = results;

    // Loop through all query routing (for loop so we can return)
    for (let i = 0; i < queryRoutingResults.length; i++) {
      const [queryRedirect, queryRenderProps] = queryRoutingResults[i];
      const queryRoute = queryRoutingConfigs[routeQueryParams[i]];
      const queryValue = queryParams[routeQueryParams[i]];

      // Update the query memoryHistory if it does not match the current path in the query param
      if (queryRoute.history.getCurrentLocation().pathname !== queryValue) {
        queryRoute.history.push(queryValue);
      }

      // If the query result is a redirect, perform a redirect on the main history object
      if (queryRedirect) {
        this.renderInProgress = false;
        queryRoute.history.replace(queryRedirect.pathname);
        throw new InterruptRenderError();
      }

      // Update the routing result in the render props. This causes the view to update accordingly
      queryRoute.renderProps = queryRenderProps || null;
    }

    return queryRoutingResults.map(([, renderProps], index) => ({
      renderProps,
      history: queryRoutingConfigs[routeQueryParams[index]].history,
      queryParam: routeQueryParams[index],
    }));
  };

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
          history: queryRoutingConfigs[queryParam].history,
          location: queryParams[queryParam],
        }),
      ),
    ).then(queryRoutingResults => ({
      queryRoutingResults,
      queryRoutingConfigs,
      routeQueryParams,
      queryParams,
    }));
  };

  /**
   * Sets the react-router Routes config used for resolving routes. Can be updated at runtime
   * when using hot module reloading in development.
   * @param Routes A react-router configuration component
   */
  setReactRoutes = Routes => {
    this.Routes = Routes;
    if (this.history) {
      this.processedRoutes = processQueryRouting(this.Routes, this.history);
    }

    if (this.firstRenderStarted && WP_DEFINE_ENABLE_REACT_HOT_LOADER) {
      this.renderPage();
    }
  };

  /**
   * Creates a Redux.JS store with the given reducer or updates the current store if it already
   * exists. Can be called at runtime when using hot module reloading in development.
   * @param reduxReducer The main redux reducer
   */
  setReduxReducer = reduxReducer => {
    if (this.store) {
      this.store.replaceReducer(reduxReducer);
    } else {
      const browserHistory = useRouterHistory(createHistory)({
        basename: (WP_DEFINE_PUBLIC_PATH || '').replace(/\/$/gi, ''), // remove trailing /
      });

      this.store = createStoreInstance(reduxReducer, browserHistory, this.reduxListenersSetup);

      // must be placed here, because we need the created store for config,
      // but it must be done before any actions are dispatched (like the
      // history line after this)
      const config = this.store.getState().config.environmentConfig;
      setupInjects(config, this.store.dispatch);

      this.history = syncHistoryWithStore(browserHistory, this.store);
      if (this.Routes) {
        this.processedRoutes = processQueryRouting(this.Routes, this.history);
      }
    }
  };

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
          history: queryRoutingConfigs[queryParam].history,
          location: queryParams[queryParam],
        }),
      ),
    ).then(queryRoutingResults => ({
      queryRoutingResults,
      queryRoutingConfigs,
      routeQueryParams,
      queryParams,
    }));
  };
}

export default ReactClient;
