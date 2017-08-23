/**
 * Checks if element is within another element
 * @param el element to check
 * @param closestEl parent element to check against
 * @returns {boolean}
 */
export function closestCheck(el, closestEl) {
  let element = el;
  while (element !== closestEl) {
    element = el.parentNode;

    if (!element) return false;
  }

  return true;
}

/**
 * Select the closest parent with provided class name
 * @param el current element
 * @param className class name to find
 * @returns {HTMLElement}
 */
export function closestSelect(el, className) {
  let parent = el;

  while (parent && parent.classList && !parent.classList.contains(className)) {
    parent = parent.parentNode;

    if (parent && parent.classList && parent.classList.contains(className)) {
      return parent;
    }
  }

  return null;
}
