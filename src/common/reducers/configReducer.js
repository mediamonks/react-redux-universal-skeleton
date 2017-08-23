import { SET_RENDER_MODE } from '../actions/renderActions';
import { SET_ENVIRONMENT_CONFIG } from '../actions/configActions';

const configReducer = (
  state = {
    renderMode: 'client',
    viewerCountry: null,
    environmentConfig: {},
  },
  action,
) => {
  switch (action.type) {
    case SET_RENDER_MODE:
      return {
        ...state,
        renderMode: action.payload,
      };
    case SET_ENVIRONMENT_CONFIG:
      return {
        ...state,
        environmentConfig: action.payload,
      };
    default:
      return state;
  }
};

export default configReducer;
