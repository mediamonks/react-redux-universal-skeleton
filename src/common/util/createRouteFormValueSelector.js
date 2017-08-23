import { createSelector } from 'reselect';

const createRouteFormValueSelector = (fieldNames, transformValues = f => f) =>
  createSelector(
    state => state.locationBeforeTransitions,
    location =>
      location
        ? transformValues(
            fieldNames.reduce((result, fieldName) => {
              const { query = {} } = location;
              result[fieldName] = query[fieldName] || null; // eslint-disable-line no-param-reassign
              return result;
            }, {}),
          )
        : transformValues({}),
  );

export default createRouteFormValueSelector;
