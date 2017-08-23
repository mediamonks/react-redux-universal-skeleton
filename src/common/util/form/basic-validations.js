/* eslint-disable import/prefer-default-export */
// disable the lint rule for now. We will add more functions to this file in the future

/**
 * This file contain custom validation rules which aren't in validator npm
 * @module
 * @category forms
 */

export function required(value) {
  return value || value === 0;
}

export function other(value) {
  return !(!value || value === '');
}

export function equals(value, comparedvalue) {
  return value === comparedvalue;
}

// used for boolean toggles 1 = true, will pass.
export function bool(value) {
  return value === '1';
}

export function minWords(value, numOfWords) {
  return value && (value.match(/\w+/g) || { length: 0 }).length >= numOfWords;
}

// Use regular expression validation
export function matchRegexp(regex, value) {
  return regex.test(value);
}

export function minLength(value, length) {
  return !(!value || value.length < length);
}

export function maxLength(value, length) {
  return !(!value || value.length > length);
}
