import { handleActions } from 'redux-actions';
import {
  CLEAR_SCROLL_TO,
  SCROLL_TO,
  REGISTER_FIXED_HEADER_ELEMENT,
  UNREGISTER_FIXED_HEADER_ELEMENT,
} from '../../../actions/scrollActions';

const initialState = {
  scrollTo: [],
  fixedHeaderElements: {},
};

const scrollManagerReducer = handleActions(
  {
    [CLEAR_SCROLL_TO]: state =>
      state.scrollTo.length
        ? {
            ...state,
            scrollTo: [],
          }
        : state,
    [SCROLL_TO]: (state, { payload: { position, onlyScrollWhenNotInView } }) => ({
      ...state,
      scrollTo: [
        ...state.scrollTo,
        {
          position,
          onlyScrollWhenNotInView,
        },
      ],
    }),
    [REGISTER_FIXED_HEADER_ELEMENT]: (state, { payload: { elementName, bottomY } }) => ({
      ...state,
      fixedHeaderElements: {
        ...state.fixedHeaderElements,
        [elementName]: bottomY,
      },
    }),
    [UNREGISTER_FIXED_HEADER_ELEMENT]: (state, { payload: elementName }) => {
      const {
        [elementName]: toRemove, // eslint-disable-line no-unused-vars
        ...newState
      } = state.fixedHeaderElements;

      return {
        ...state,
        fixedHeaderElements: newState,
      };
    },
  },
  initialState,
);

export default scrollManagerReducer;
