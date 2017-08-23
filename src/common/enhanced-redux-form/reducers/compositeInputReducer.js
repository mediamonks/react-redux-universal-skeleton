import {
  REGISTER_COMPOSITE_INPUT,
  UNREGISTER_COMPOSITE_INPUT,
  COMPOSE_COMPOSITE_INPUT,
} from '../actions/compositeInputActions';

const compositeInput = (state = {}, action) => {
  switch (action.type) {
    case REGISTER_COMPOSITE_INPUT: {
      const { payload: { formatter, composeOn } } = action;
      return {
        ...state,
        formatter,
        composeOn,
      };
    }
    case COMPOSE_COMPOSITE_INPUT: {
      const { payload: { value } } = action;
      return {
        ...state,
        composedValue: value,
      };
    }
    default:
      return state;
  }
};

const formCompositeInputs = (state = {}, action) => {
  switch (action.type) {
    case REGISTER_COMPOSITE_INPUT:
    case COMPOSE_COMPOSITE_INPUT: {
      const { payload: { field } } = action;
      return {
        ...state,
        [field]: compositeInput(state[field], action),
      };
    }
    case UNREGISTER_COMPOSITE_INPUT: {
      const { payload: { field } } = action;
      // eslint-disable-next-line no-unused-vars
      const { [field]: toRemove, ...newState } = state;
      return newState;
    }
    default:
      return state;
  }
};

const compositeInputs = (state = {}, action) => {
  switch (action.type) {
    case REGISTER_COMPOSITE_INPUT:
    case COMPOSE_COMPOSITE_INPUT: {
      const { meta: { form } } = action;

      return {
        ...state,
        [form]: formCompositeInputs(state[form], action),
      };
    }
    case UNREGISTER_COMPOSITE_INPUT: {
      const { meta: { form } } = action;
      const formState = formCompositeInputs(state[form], action);

      if (!Object.keys(formState).length) {
        // eslint-disable-next-line no-unused-vars
        const { [form]: toRemove, ...newState } = state;
        return newState;
      }

      return {
        ...state,
        [form]: formState,
      };
    }
    default:
      return state;
  }
};

export default compositeInputs;
