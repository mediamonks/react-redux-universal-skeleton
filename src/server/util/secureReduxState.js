import { compose } from 'redux';
import stripPrivateEnvironmentConfig from './stripPrivateEnvironmentConfig';

/** @module */

/**
 * Removes the authentication tokens from the authentication reducer
 * @function secureAuthTokens
 * @private
 * @param state The current redux state
 */
const secureAuthState = state => {
  if (state.authentication) {
    return {
      ...state,
      authentication: {
        ...state.authentication,
        accessToken: null,
        idToken: null,
      },
    };
  }

  return state;
};

/**
 * Removes the private environment config (all keys that have been prefixed with '__')
 * from the authentication reducer
 * @function secureEnvironmentConfig
 * @private
 * @param state The current redux state
 */
const secureEnvironmentConfig = state => ({
  ...state,
  config: {
    ...state.config,
    environmentConfig: stripPrivateEnvironmentConfig(state.config.environmentConfig),
  },
});

/**
 * Strips the non-serializable state (as we cannot serialize it to send it to the client).
 * @function stripNonSerializable
 * @private
 * @param state The current redux state
 */
const stripNonSerializable = state => ({
  ...state,
  nonSerializable: {},
});

/**
 * Filters the current redux store state before exposing it to the client
 * @function secureReduxState
 * @param state The redux store state
 * @returns {object} The secured redux store state that will be serialized and passed to
 * the client.
 * @default
 */
const secureReduxState = compose(secureEnvironmentConfig, secureAuthState, stripNonSerializable);

export default secureReduxState;
