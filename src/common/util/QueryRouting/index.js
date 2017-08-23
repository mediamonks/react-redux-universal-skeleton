import { PropTypes } from 'react';

const QueryRouting = () => {
  throw new Error(
    '<QueryRouting> elements are for router configuration only and should not be rendered',
  );
};

QueryRouting.displayName = 'QueryRouting';

QueryRouting.propTypes = {
  query: PropTypes.string,
  children: PropTypes.node,
};

export default QueryRouting;
