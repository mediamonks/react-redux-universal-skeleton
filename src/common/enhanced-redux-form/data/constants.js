/* eslint-disable import/prefer-default-export */

/** @module enhanced-redux-form/data/constants */

/**
 * Prefix for the name that is used on the redux-form FormSection component. We cannot
 * use the same name as the CompositeInput name, because that would cause name conflicts
 * in the redux state of redux-form.
 * @type {string}
 * @constant
 */
export const COMPOSITE_FORMSECTION_NAME_PREFIX = '_composite-input-';
