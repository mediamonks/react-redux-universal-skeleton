import { makeNonSerializableSelector } from '../reducers/nonSerializableReducer';
import { clearNonSerializable, registerNonSerializable } from '../actions/nonSerializableActions';

/**
 * Namespace to use in the nonSerializable reducer
 * @type {string}
 */
const THUNKS_NAMESPACE = 'thunks';

/**
 * Incrementing counter to assign thunk ids to async actions
 * @type {number}
 */
let thunkIdCount = 0;

/**
 * Wraps a given thunk action to prevent it from executing multiple times simultaneously
 * within a single request. If an execution is already pending when calling the action creator,
 * it will return the promise for that execution. NodeJS may execute the given thunk multiple times
 * in parallel, as long as it is not tied to the same request. Once the Promise returned by the
 * given thunk action creator has resolved, it may be executed again.
 * @param {func} thunk A thunk action creator that returns a promise
 * @param {boolean} [withArgs=false] If true, will only prevent duplicate calls with the same
 * arguments. **important: the supplied arguments should be serializable**
 * @returns {function} A wrapped thunk action creator
 */
function dedupeAsyncThunk(thunk, withArgs = false) {
  const identifier = ++thunkIdCount; // eslint-disable-line no-plusplus
  const thunkSelector = makeNonSerializableSelector(THUNKS_NAMESPACE);

  return (...args) => (dispatch, getState) => {
    const { nonSerializable } = getState();
    const callIdentifier = withArgs ? `${identifier}${JSON.stringify(args)}` : identifier;
    const pendingPromise = thunkSelector(nonSerializable, { key: callIdentifier });

    if (pendingPromise) {
      return pendingPromise;
    }

    const promise = thunk(...args)(dispatch, getState);
    dispatch(registerNonSerializable(callIdentifier, promise, THUNKS_NAMESPACE));
    promise.then(() => dispatch(clearNonSerializable(callIdentifier, THUNKS_NAMESPACE)));
    return promise;
  };
}

export default dedupeAsyncThunk;
