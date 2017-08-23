```
import { handleActions } from 'redux-actions';
import { SET_PROP_VALUES } from '../src/app/guide/action/browserActions';
import { SET_CONTEXT_KEYS } from '../src/app/guide/action/contextActions';

// use handleActions helper where possible
export default handleActions({
  // uses dictionary instead of switch/case
  // destructure the action and payload
  [SET_CONTEXT_KEYS]: (state, { payload: { contextKeys } }) => ({
    ...state,
    contextKeys,
    contextKeysRevision: state.contextKeysRevision + 1,
  }),

  [SET_PROP_VALUES]: (state, { payload: { values } }) => ({
    ...state,
    propValues: {
      ...state.propValues,
      ...values,
    },
  }),
  // passes initial state as last parameter
}, {
  contextKeys: [],
  contextKeysRevision: 0,
  propValues: {},
});
```