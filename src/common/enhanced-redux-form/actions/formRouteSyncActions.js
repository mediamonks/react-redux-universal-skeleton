/* eslint-disable import/prefer-default-export */
import { push as historyPush } from 'react-router-redux';
import { stringify } from 'qs';
import debugLib from 'debug';

const debug = debugLib('React:formRouteSyncActions');

/**
 * Updates the current route query string with the provided values. If the values
 * in the query string are already equal to the given values, no update will be
 * dispatched.
 * @param {Object} values An object with values to set on the query string
 */
export const syncValuesToRoute = values => (dispatch, getState) => {
  const { locationBeforeTransitions } = getState().routing;

  if (locationBeforeTransitions) {
    const { query = {} } = locationBeforeTransitions;
    const keys = Object.keys(values);

    if (keys.every(key => values[key] === query[key])) {
      debug('Ignoring call to syncValuesToRoute(): route query already matches given values.');
    } else {
      const newQuery = { ...query };
      keys.forEach(key => {
        const value = values[key];
        if (value === null || value === '') {
          delete newQuery[key];
        } else {
          newQuery[key] = value;
        }
      });

      dispatch(
        historyPush({
          pathname: locationBeforeTransitions.pathname,
          search: `?${stringify(newQuery)}`,
        }),
      );
    }
  } else {
    debug('Ignoring call to syncValuesToRoute(): no location found on state.');
  }
};
