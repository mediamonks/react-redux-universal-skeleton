import { createAction } from 'redux-actions';

export const SET_DEVICE_STATE = 'deviceStateActions/SET_DEVICE_STATE';

export const setDeviceState = createAction(SET_DEVICE_STATE, (state, name) => ({ state, name }));
