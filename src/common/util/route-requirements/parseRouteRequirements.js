/* global WP_DEFINE_DEVELOPMENT */
import RouteRequirement from './RouteRequirement';

/**
 * Looks up the route requirements by looking at the `requirements` prop on the
 * given routes array. The `requirement` prop on child routes overrides those on parent
 * routes, so this function will only use the last `requirements` prop it can find.
 *
 * Returns an array of which route requirements must be met, based on the requirements
 * in the `requirements` prop **and its child requirements**.
 *
 * If none of the routes have a `requirements` prop defined, this will return an
 * empty array.
 * @param {Array} routes An array of react-router <Route> instances.
 * @returns {Array<RouteRequirement>} An array of RouteRequirement instances.
 * @category routing
 */
function parseRoutesRequirements(routes) {
  const lastRouteWithProp = routes.filter(route => typeof route.requirements !== 'undefined').pop();
  const requirementsProp = lastRouteWithProp ? lastRouteWithProp.requirements : [];
  const requirements = new Set();

  if (WP_DEFINE_DEVELOPMENT && lastRouteWithProp) {
    let routeDescription = `with path "${lastRouteWithProp.path}"`;
    if (!lastRouteWithProp.path && lastRouteWithProp.component) {
      routeDescription = `with component "${lastRouteWithProp.component.displayName ||
        lastRouteWithProp.component.name}"`;
    }
    if (!Array.isArray(requirementsProp)) {
      throw new TypeError(
        `Expected requirements to be an Array. Check "requirement" prop of route ${routeDescription}`,
      );
    }
    requirementsProp.forEach(requirement => {
      if (!(requirement instanceof RouteRequirement)) {
        throw new TypeError(
          `Elements in requirements should be instanceof RouteRequirement. Check "requirement" prop of route ${routeDescription}`,
        );
      }
    });
  }

  const addRequirements = requirementsToAdd => {
    requirementsToAdd.forEach(requirement => {
      addRequirements(requirement.childRequirements);

      requirements.add(requirement);
    });
  };
  addRequirements(requirementsProp);

  return Array.from(requirements);
}

export default parseRoutesRequirements;
