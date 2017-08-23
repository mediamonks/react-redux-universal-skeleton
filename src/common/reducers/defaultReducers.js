import { reducer as form } from 'redux-form';
import { initReducer as init } from 'react-redux-component-init';
import { routerReducer as routing } from 'react-router-redux';
import config from './configReducer';
import asyncReducer from './asyncReducer';
import enhancedForm from '../enhanced-redux-form/reducers';
import nonSerializable from './nonSerializableReducer';
import error from './errorReducer';
import deviceState from './deviceStateReducer';

/**
 * Object containing all the default reducers that should be included in the main reducer
 * by every microservice.
 */
export default {
  config,
  form,
  enhancedForm,
  routing,
  async: asyncReducer,
  init,
  nonSerializable,
  error,
  deviceState,
};
