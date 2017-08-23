/* global WP_DEFINE_ENABLE_REACT_HOT_LOADER */

/** @module */

/**
 * Wrapper for a lazy loaded component route
 * @function routeCallback
 * @param component
 * @param namedExport
 * @returns {function}
 */
const routeCallback = (component, namedExport = 'default') => (location, cb) =>
  component(result => cb(null, result[namedExport]));

export const getRouteComponentProp = componentImport => {
  if (module.hot && WP_DEFINE_ENABLE_REACT_HOT_LOADER) {
    return { component: componentImport };
  }

  return { getComponent: routeCallback(componentImport) };
};

export default routeCallback;
