/* global WP_DEFINE_IS_NODE */
import React, { Children } from 'react';
import { createMemoryHistory } from 'react-router';
import debugLib from 'debug';

const debug = debugLib('React:queryRouting');

/**
 * Processes the <QueryRouting> configuration nested inside the routing config. Will
 * create history instances for each defined <QueryRouting>.
 * @function processQueryRouting
 * @param route The current route. This function will be called recursively
 * @param mainHistory The history instance of the main routing
 */
const processQueryRouting = (route, mainHistory) => {
  const queryRoutes = {};

  // handle null children
  if (!route) {
    return route;
  }

  // We build a new array of children which we use to clone a new <Route> component below
  const newChildren =
    (route.props && route.props.children && Children.toArray(route.props.children)) || null;

  if (newChildren) {
    for (let i = newChildren.length - 1; i >= 0; i--) {
      if (newChildren[i].type.displayName === 'QueryRouting') {
        // child is <QueryRouting />. Process the config and remove the child
        const queryParam = newChildren[i].props.query;

        let history = null;
        if (!WP_DEFINE_IS_NODE) {
          // we only create a history instance on the browser. As we don't do any navigation
          // after first render on the server, we aren't interested in the history
          history = createMemoryHistory();
          history.listen(({ action, pathname, search, hash }) => {
            const location = mainHistory.getCurrentLocation();
            debug(
              `Navigate within [${queryParam}]: { action: "${action}", pathname: "${pathname}"}`,
            );

            if (action) {
              if (action === 'POP') {
                mainHistory.goBack();
              } else if (location.query[queryParam] !== pathname) {
                // custom 'escape' to navigate with the main router instead of the query routing
                // technically this conflicts with the normal '../' path navigation, but since we
                // only use the Pages enum, we can 'reserve' that pattern for this use case.
                if (pathname.startsWith('../')) {
                  mainHistory[action.toLowerCase()]({
                    pathname: pathname.slice(2),
                    search,
                    hash,
                  });
                } else {
                  // apply the pathname to the query while keeping the normal location the same
                  mainHistory[action.toLowerCase()]({
                    ...location,
                    query: {
                      ...(location.query || {}),
                      [queryParam]: pathname,
                    },
                  });
                }
              }
            }
          });
        }

        // save the config on the queryRoutes object, which will be attached as a prop on the
        // <Route> Component below
        queryRoutes[queryParam] = {
          history,
          routes: newChildren[i],
          renderProps: null,
        };

        // remove the <QueryRouting> child. react-router does not understand this
        newChildren.splice(i, 1);
      } else {
        // child is a normal <Route />. Process that route recursively
        newChildren[i] = processQueryRouting(newChildren[i], mainHistory);
      }
    }
  }

  return React.cloneElement(
    route,
    {
      queryRoutes,
    },
    newChildren,
  );
};

export default processQueryRouting;
