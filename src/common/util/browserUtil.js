/**
 * Utilities to detect the user's browser
 * @module
 * @category browsers
 */

/**
 * TODO: add docs
 * @param browser
 * @returns {Number}
 */
function getBrowser(browser) {
  const ua = window.navigator.userAgent;
  return ua.toLowerCase().indexOf(browser);
}

/**
 * Returns true if the browser is IE or Microsoft Edge
 * @returns {boolean}
 */
export function isIEOrEdge() {
  const msie = getBrowser('msie');
  const trident = getBrowser('trident/');
  const edge = getBrowser('edge/');

  return msie > -1 || trident > -1 || edge > -1;
}

/**
 * Returns true if the browser is IE
 * @returns {boolean}
 */
export function isIE() {
  const msie = getBrowser('msie');
  const trident = getBrowser('trident/');

  return msie > -1 || trident > -1;
}

/**
 * Returns true if the browser is FireFox
 * @returns {boolean}
 */
export function isFF() {
  const ff = getBrowser('firefox');
  return ff > -1;
}
