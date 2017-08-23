/**
 * The values of these constants represent the additional events (besides before validation)
 * on which a CompositeInput should execute it's formatter to compose the child field values
 * into a single value.
 * @module enhanced-redux-form/utils/ComposeOn
 * @category forms
 */

/**
 * @type {string}
 */
export const VALIDATE_AND_CHANGE = 'CHANGE';

/**
 * @type {string}
 */
export const VALIDATE_AND_BLUR = 'BLUR';

/**
 * @type {string}
 */
export const VALIDATE_AND_FOCUS = 'FOCUS';

/**
 * @type {string}
 */
export const VALIDATE = null;
