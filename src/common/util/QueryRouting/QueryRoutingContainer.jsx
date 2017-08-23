import React, { PropTypes } from 'react';
import { RouterContext } from 'react-router';

const QueryRoutingContainer = ({ query }, { router }) => {
  for (let i = router.routes.length - 1; i >= 0; i--) {
    const route = router.routes[i];
    if (route.queryRoutes && route.queryRoutes[query] && route.queryRoutes[query].renderProps) {
      return <RouterContext {...route.queryRoutes[query].renderProps} />;
    }
  }

  return <noscript />;
};

QueryRoutingContainer.contextTypes = {
  router: PropTypes.objectOf(PropTypes.any),
};

QueryRoutingContainer.propTypes = {
  query: PropTypes.string.isRequired,
};

export default QueryRoutingContainer;
