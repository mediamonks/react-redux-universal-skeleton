/* global WP_DEFINE_DEVELOPMENT */
import { routerMiddleware } from 'react-router-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import { actionTypes } from 'react-redux-component-init';
import { persistStore, autoRehydrate } from 'redux-persist';
import CookieStorage from 'redux-persist-cookie-storage';
import thunk from 'redux-thunk';
import checkFSA from '../../common/util/checkFSAMiddleware';
import { asyncAction } from '../../common/util/asyncActionMiddleware';
import enhancedReduxFormMiddleware from '../../common/enhanced-redux-form/enhancedReduxFormMiddleware';
import { getClient } from '../../common/util/raven/raven-client';
import createRavenMiddleware from '../../common/util/raven/middleware';
import reduxConfig from '../../common/config/redux.configdefinitions';
import reduxListenersMiddleware from '../../common/util/redux-listeners-middleware';

const createStoreInstance = (reducer, history, reduxListenersSetup = []) => {
  /* eslint-disable dot-notation */
  const middleware = [
    asyncAction,
    thunk,
    // asyncTrackingMiddleware, // disable until we can batch the tracking
    reduxListenersMiddleware(reduxListenersSetup),
    routerMiddleware(history),
    enhancedReduxFormMiddleware,
  ];
  if (reduxConfig.useRavenMiddleware) {
    middleware.unshift(createRavenMiddleware(getClient));
  }
  if (WP_DEFINE_DEVELOPMENT) {
    middleware.push(checkFSA);
  }

  const composeEnhancers =
    (window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] &&
      window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__']({
        maxAge: 200,
        actionsBlacklist: [
          '@@redux-form/REGISTER_FIELD',
          '@@redux-form/UNREGISTER_FIELD',
          actionTypes.INIT_COMPONENT,
        ],
      })) ||
    compose;
  const additionalEnhancers = [];
  if (reduxConfig.persistKeys.length) {
    additionalEnhancers.push(autoRehydrate());
  }
  const storeEnhancer = composeEnhancers(applyMiddleware(...middleware), ...additionalEnhancers);
  const store = createStore(reducer, window['state'], storeEnhancer);
  if (reduxConfig.persistKeys.length) {
    persistStore(store, {
      storage: new CookieStorage(),
      whitelist: reduxConfig.persistKeys,
    });
  }
  return store;
  /* eslint-enable dot-notation */
};

export default createStoreInstance;
