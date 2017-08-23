/* global WP_DEFINE_DEVELOPMENT */

// Yes, this is global state, but couldn't find another method
// the raven client should only be created once when starting the server
// and could be used in all other places to log errors
let ravenClient = null;

/** @module */

/**
 * Gets either the server or browser version of the Raven client
 * Can be called from any isomorphic code
 * @return {*}
 */
export function getClient() {
  return ravenClient;
}

/**
 * Create/config a raven client for nodejs.
 *
 * @function createClientOnServer
 * @param raven The nodejs raven client
 * @param ravenConfig The nodejs raven config
 * @param buildInfo Will be added to all exceptions to track in which builds the errors
 * are happening
 * @return {*}
 * @category tracking
 */
export function createClientOnServer(raven, ravenConfig, buildInfo) {
  if (isNonDevEnvironment()) {
    return null;
  }

  raven
    .config(ravenConfig.dsn, {
      dataCallback: data => {
        // remove references to the environment
        /* eslint-disable no-param-reassign */
        if (data && data.request) {
          delete data.request.env;
        }
        /* eslint-enable */
        return data;
      },
      release: buildInfo.release,
      commit: buildInfo.commit,
      branch: buildInfo.branch,
      tag: buildInfo.tag,
      fingerprint: ['{{ default }}', process.env.NODE_ENV],
      autoBreadcrumbs: {
        console: true,
        http: true,
        postgres: false,
      },
      captureUnhandledRejections: true,
    })
    .install();

  raven.setContext({
    tags: {
      env: process.env.NODE_ENV,
    },
  });

  // globall error handler
  raven.install((a, err) => {
    /* eslint-disable no-console */
    console.error(err.stack.replace('\\n', '\n'));
    /* eslint-enable */
    process.exit(1);
  });

  ravenClient = raven;

  return ravenClient;
}

/**
 * Create/config a raven client for the browser.
 *
 * @function configureRavenOnClient
 * @param Raven The javascript raven client
 * @param ravenConfig The nodejs raven config
 * @param buildInfo Will be added to all exceptions to track in which builds the errors
 * are happening
 * @category tracking
 */
export function configureRavenOnClient(Raven, ravenConfig, buildInfo) {
  if (!isNonDevEnvironment()) {
    return;
  }

  Raven.config(ravenConfig.dsn, {
    // we highly recommend restricting exceptions to a domain in order to filter out clutter
    whitelistUrls: ravenConfig.whitelistUrls.split(','),
    ignoreErrors: [
      // Random plugins/extensions
      'top.GLOBALS',
      // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error. html
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.epicplay.com',
      "Can't find variable: ZiteReader",
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'http://loading.retry.widdit.com/',
      'atomicFindClose',
      // Facebook borked
      'fb_xd_fragment',
      // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
      // reduce this. (thanks @acdha)
      // See http://stackoverflow.com/questions/4113268
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
      'conduitPage',
    ],
    ignoreUrls: [
      // Facebook flakiness
      /graph\.facebook\.com/i,
      // Facebook blocked
      /connect\.facebook\.net\/en_US\/all\.js/i,
      // Woopra flakiness
      /eatdifferent\.com\.woopra-ns\.com/i,
      /static\.woopra\.com\/js\/woopra\.js/i,
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Other plugins
      /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
      /webappstoolbarba\.texthelp\.com\//i,
      /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
    ],
    release: buildInfo.release,
    commit: buildInfo.commit,
    branch: buildInfo.branch,
    tag: buildInfo.tag,
    autoBreadcrumbs: true,
  }).install();

  ravenClient = Raven;
}

/**
 * Used for capturing XHR errors from any of the API Gateways
 * @param error
 */
export function captureXhrError(error) {
  const client = getClient();
  if (client) {
    client.captureMessage(error.error.message, {
      extra: {
        type: error.request.method,
        url: error.request.url,
        data: error.request.body,
        status: error.response.status,
        error: `${error.error.message}-${error.request.url}`,
        response: error.response.text.substring(0, 255),
      },
      fingerprint: ['{{ default }}', error.request.url],
    });
  }
}

/**
 * Check to stop running raven when in development mode, since it will include itself in the stack
 * trace from errors and console logs.
 * Note, by default your NODE_ENV will be 'undefined', so to properly use this check you need to
 * set it locally.
 */
const isNonDevEnvironment = () =>
  ['production', 'test', 'acceptance'].includes(process.env.NODE_ENV) ||
  (!process.env.NODE_ENV && !WP_DEFINE_DEVELOPMENT);
