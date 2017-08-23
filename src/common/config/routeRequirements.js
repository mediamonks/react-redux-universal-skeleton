/** @module */

// import RouteRequirement from '../util/route-requirements/RouteRequirement';

/**
 * Requires that the user is logged in __if on the server__. On the client, the check
 * for authentication will happen in ClientAuthenticationManager. This is because
 * the page render can start before authentication happens.
 * @type {RouteRequirement}
 */
// export const authenticated = new RouteRequirement(
//   'authenticated',
//   [],
//   getState => !WP_DEFINE_IS_NODE || hasAccessTokenSelector(getState().authentication),
//   (getState, renderProps, { redirectToLogin }) => redirectToLogin()
// );
