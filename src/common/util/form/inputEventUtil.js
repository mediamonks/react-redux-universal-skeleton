import { isIEOrEdge, isFF } from 'src/common/util/browserUtil';

const KEY_CODE_ENTER = 13;

/**
 * Utilities for handling input events on forms
 * @module
 * @category forms
 */

/**
 * Block alphabet value input
 * @param event
 */
export const preventNonNumericInput = event => {
  if (event.charCode < 48 || event.charCode > 57) {
    event.preventDefault();
  }
};

/**
 * Prevent user to input more than it needs
 * @param event
 * @param maxLength
 */
export const preventMaxLengthInput = (event, maxLength) => {
  if (event.currentTarget.value.length >= maxLength) {
    event.preventDefault();
  }
};

/**
 * When typing on a selected text reset the input value
 * @param event
 * @param maxLength
 */
export const textSelectionReset = (event, maxLength) => {
  if (getTextSelection() !== '' && event.currentTarget.value.length <= maxLength) {
    /* eslint-disable no-param-reassign */
    event.currentTarget.value = '';
  }
};

/**
 * @returns {string}
 */
function getTextSelection() {
  let selectedText = '';
  if (window.getSelection) {
    if (
      (isIEOrEdge() || isFF()) &&
      document.activeElement &&
      (document.activeElement.tagName.toLowerCase() === 'textarea' ||
        document.activeElement.tagName.toLowerCase() === 'input')
    ) {
      const text = document.activeElement.value;
      selectedText = text.substring(
        document.activeElement.selectionStart,
        document.activeElement.selectionEnd,
      );
    } else {
      const selRange = window.getSelection();
      selectedText = selRange.toString();
    }
  } else if (document.selection.createRange) {
    // Internet Explorer
    const range = document.selection.createRange();
    selectedText = range.text;
  }

  return selectedText;
}

/**
 * @param event
 * @param maxLength
 */
export const handleFieldGroupInput = (event, maxLength) => {
  if (event.charCode === KEY_CODE_ENTER) {
    return;
  }
  preventNonNumericInput(event);
  textSelectionReset(event, maxLength);
  preventMaxLengthInput(event, maxLength);
};

/**
 * Prevent enter submission
 * @param event
 */
export const preventEnterSubmit = event =>
  event.charCode === KEY_CODE_ENTER ? event.preventDefault() : true;
