import { handleActions } from 'redux-actions';
import { createSelector } from 'reselect';
import { ADD_ERROR, CLEAR_ERRORS } from '../actions/errorActions';

const initialState = [];

const errorReducer = handleActions(
  {
    [ADD_ERROR]: (state, { payload }) => [...state, payload],
    [CLEAR_ERRORS]: () => initialState,
  },
  initialState,
);

export default errorReducer;

export const hasErrors = createSelector(state => state, errors => !!errors.length);

export const getError = createSelector(state => state, errors => errors[0]);
