/**
 * Function that determines if the scroll position should be updated. Called when
 * navigating to a new route.
 * See: {@link https://github.com/taion/react-router-scroll#custom-scroll-behavior}
 *
 * @function shouldUpdateScroll
 * @param {object} prevRouterProps
 * @param {object} routerProps
 * @returns {any} Currently always returns 'true', which will emulate the browser
 * behavior
 * @category templating
 */
const shouldUpdateScroll = (prevRouterProps, { location }) =>
  prevRouterProps && location.pathname !== prevRouterProps.location.pathname;

export default shouldUpdateScroll;
