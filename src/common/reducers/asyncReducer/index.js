import { createSelector } from 'reselect';
import { combineReducers } from 'redux';
import actions from './asyncActionsReducer';

const asyncReducer = combineReducers({
  actions,
});

const actionsSelector = state => state.actions;
export const pendingActionsSelector = createSelector([actionsSelector], allActions =>
  allActions.filter(action => !action.isFulfilled),
);
export const numTotalActionsSelector = createSelector(
  [actionsSelector],
  allActions => allActions.length,
);
export const numPendingActionsSelector = createSelector(
  [pendingActionsSelector],
  pendingActions => pendingActions.length,
);

export default asyncReducer;
