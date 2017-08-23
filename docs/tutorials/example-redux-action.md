```
// when possible, use redux-actions to create the action creators
// they adhere to the flux-standard-actions standard
// https://github.com/acdlite/flux-standard-action
import { createAction } from 'redux-actions';

export const SET_PROP_VALUES = 'SET_PROP_VALUES';

export const setPropValues = createAction(SET_PROP_VALUES, (values) =>
  ({ values })
);

```