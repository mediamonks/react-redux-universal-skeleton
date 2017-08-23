/* global WP_DEFINE_IS_NODE */ // eslint-disable-line

import debugLib from 'debug';
import stripColorCodes from 'stripcolorcodes';
import { getClient } from 'src/common/util/raven/raven-client';

/** @module */

/**
 * Patches the global debug lib by also adding raven breadcrumbs
 *
 * @function enableDebugBreadcrumb
 * @category tracking
 */
// eslint-disable-next-line import/prefer-default-export
export const enableDebugBreadcrumb = () => {
  debugLib.log = message => {
    // node has colorized messages being written ti stdout,
    // so they are not being captured by the console autoBreadcrumb wrapper.
    if (WP_DEFINE_IS_NODE) {
      // output to the stdout to view the log
      process.stdout.write(`${message}\n`);

      // save breadcrumb without color-codes
      const ravenClient = getClient();
      if (ravenClient) {
        ravenClient.captureBreadcrumb({
          message: stripColorCodes(message),
          level: 'debug',
          category: 'debug',
        });
      }
    } else {
      // do normal console log that is captured automatically
      console.log(message); // eslint-disable-line no-console
    }
  };
};
