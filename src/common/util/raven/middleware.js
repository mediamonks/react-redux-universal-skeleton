const identity = _ => _;

/** @module */

/**
 * Only copy the keys from the config over from the state
 * @param state
 */
const transformStateKeysToCapture = state => {
  const captureState = {};

  // get comma-separated list of keys from the config in the state
  const stateKeysToCapture =
    state.config &&
    state.config.environmentConfig &&
    state.config.environmentConfig.raven &&
    state.config.environmentConfig.raven.stateKeysToCapture;

  // copy each key over from the state to be captured
  (stateKeysToCapture || '').split(',').forEach(key => {
    if (key in state) {
      captureState[key] = state[key];
    }
  });
  return captureState;
};

/**
 * Creates a middleware to save redux actions as raven breadcrumbs
 * @function createMiddleware
 * @param {function} getRavenClient Retrieve the raven client (that is saved at a later time)
 * @param {object} [options] Customize extra data sent to sentry
 * @param {function} [options.actionTransformer] Transform the action object to send; default to
 * identity function
 * @param {function} [options.stateTransformer] Transform the action state to send; default to
 * identity function
 * @param {function} [options.logger] The logger to use for logging; default to console.error
 * @return {function(*=): function(*): function(*=)}
 * @category tracking
 */
export default function createMiddleware(getRavenClient, options = {}) {
  return store => next => action => {
    const {
      actionTransformer = identity,
      stateTransformer = transformStateKeysToCapture,
      // eslint-disable-next-line no-console
      logger = console.error.bind(console, '[redux-raven-middleware] Reporting error to Sentry:'),
    } = options;

    const ravenClient = getRavenClient();

    try {
      // save breadcrumb for this action
      if (ravenClient && action.type) {
        getRavenClient().captureBreadcrumb({
          category: 'redux',
          message: action.type,
        });
      }

      return next(action);
    } catch (err) {
      logger(err);

      // Send the report
      if (ravenClient) {
        const stateToCapture = stateTransformer(store.getState());
        // error will be re-thrown and captured again, so only capture
        // the error here if we have additional state information
        if (stateToCapture) {
          ravenClient.captureException(err, {
            extra: {
              action: actionTransformer(action),
              state: stateToCapture,
            },
          });
        }
      }

      // rethrow error so the app can handle it properly
      throw err;
    }
  };
}
