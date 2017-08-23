import { createAction } from 'redux-actions';

export const SCROLL_TO = 'scrollActions/SCROLL_TO';
export const CLEAR_SCROLL_TO = 'scrollActions/CLEAR_SCROLL_TO';
export const REGISTER_FIXED_HEADER_ELEMENT = 'scrollActions/REGISTER_FIXED_HEADER_ELEMENT';
export const UNREGISTER_FIXED_HEADER_ELEMENT = 'scrollActions/UNREGISTER_FIXED_HEADER_ELEMENT';

/**
 * Action to cause the ScrollManager to scroll to the given Y position.
 * If this action is called multiple times within a debounce period (defined
 * in ScrollManager), the ScrollManager will scroll to the top most position
 */
export const scrollTo = createAction(SCROLL_TO, (position, onlyScrollWhenNotInView) => ({
  position,
  onlyScrollWhenNotInView,
}));

/**
 * Wrapper for the scrollTo action that will pass the top position of the given
 * DOM element
 * @param element The DOM element to scroll to
 * @param [offset=0] {number} An offset to add to the top position
 * @param [onlyScrollWhenNotInView=true] {boolean} When set to true, it prevents the page to scroll
 * when the target element is already in view.
 */
export const scrollToElement = (element, offset = 0, onlyScrollWhenNotInView = true) => dispatch =>
  dispatch(
    scrollTo(
      ((document.documentElement && document.documentElement.scrollTop) ||
        document.body.scrollTop) +
        element.getBoundingClientRect().top +
        offset,
      onlyScrollWhenNotInView,
    ),
  );

/**
 * Clears all the positions that should be scrolled to. Used by ScrollManager
 */
export const clearScrollTo = createAction(CLEAR_SCROLL_TO);

/**
 * Register an element that is fixed on the top of the page. This is to offset scrolling
 * to elements to make sure the fixed element does not overlap the scrolled to element.
 *
 * When the element unmounts, it should dispatch unregisterFixedHeaderElement
 *
 * @param elementName {string} A name for the element. The same name should be used
 * to unregister
 * @param bottomY {number} The bottom Y position of the fixed element.
 */
export const registerFixedHeaderElement = createAction(
  REGISTER_FIXED_HEADER_ELEMENT,
  (elementName, bottomY) => ({ elementName, bottomY }),
);

/**
 * Unregisters an element that was registered with registerFixedHeaderElement
 */
export const unregisterFixedHeaderElement = createAction(UNREGISTER_FIXED_HEADER_ELEMENT);
