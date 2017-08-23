import { captureXhrError } from 'src/common/util/raven/raven-client';

import Gateway from '../net/gateway/Gateway';
import RESTOutputHandler from '../net/gateway/output/RESTOutputHandler';
import RESTInputHandler from '../net/gateway/input/RESTInputHandler';

import { setValue } from './injector';
import { GATEWAY } from '../data/Injectables';

/**
 * Sets up the injects for use in the project.
 * This is done in a specific time in the startup flow where the required information is available,
 * but before any of the values are used.
 *
 * @function setupInjects
 * @param config {any} Config object with API information
 * @param dispatch {function} The redux store dispatch function
 */
const setupInjects = config => {
  const baseGatewayConfig = {
    mode: 'cors', // cors, no-cors, or same-origin
    outputHandler: new RESTOutputHandler(),
    inputHandler: new RESTInputHandler(),
    onError(error) {
      captureXhrError(error);
    },
  };

  // account
  const gateway = new Gateway({
    ...baseGatewayConfig,
    url: `${config.api.host}${config.api.path}`,
  });

  setValue(GATEWAY, gateway);
};

export default setupInjects;
