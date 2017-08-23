/* global WP_DEFINE_DEVELOPMENT */

import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, autoRehydrate } from 'redux-persist';
import CookieStorage from 'redux-persist-cookie-storage';
import thunk from 'redux-thunk';
// import { createLogger } from 'redux-logger'
import { routerMiddleware } from 'react-router-redux';
import checkFSA from '../../common/util/checkFSAMiddleware';
import { asyncAction } from '../../common/util/asyncActionMiddleware';
import enhancedReduxFormMiddleware from '../../common/enhanced-redux-form/enhancedReduxFormMiddleware';
import { getClient } from '../../common/util/raven/raven-client';
import createRavenMiddleware from '../../common/util/raven/middleware';
import reduxConfig from '../../common/config/redux.configdefinitions';

const middleware = [
  createRavenMiddleware(getClient),
  asyncAction,
  thunk,
  enhancedReduxFormMiddleware,
];
if (WP_DEFINE_DEVELOPMENT) {
  middleware.push(checkFSA);
  // middleware.push(createLogger({
  //   timestamp: false,
  //   colors: {},
  //   stateTransformer: () => null,
  // }));
}

const createStoreInstance = (reducer, cookies, history) => {
  const additionalEnhancers = [];
  if (reduxConfig.persistKeys.length) {
    additionalEnhancers.push(autoRehydrate());
  }
  const store = createStore(
    reducer,
    compose(applyMiddleware(...middleware, routerMiddleware(history)), ...additionalEnhancers),
  );
  if (reduxConfig.persistKeys.length) {
    persistStore(store, {
      storage: new CookieStorage({ cookies }),
      whitelist: reduxConfig.persistKeys,
    });
  }
  return store;
};

export default createStoreInstance;
