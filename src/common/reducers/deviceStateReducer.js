import { handleActions } from 'redux-actions';

import { SET_DEVICE_STATE } from '../actions/deviceStateActions';

const initialState = {
  state: null,
  name: null,
};

export default handleActions(
  {
    [SET_DEVICE_STATE]: (currentState, { payload: { state, name } }) => ({
      ...currentState,
      state,
      name,
    }),
  },
  initialState,
);
