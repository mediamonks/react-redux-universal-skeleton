/* eslint-disable import/prefer-default-export */

/**
 * Returns an object to be used as props for a link tag, that based on the url returns a different
 * attribute name. If the url is absolute, it will use the `href` prop to not link internally.
 * Otherwise it will use the `to` attribute to have it picked up by React Router.
 *
 * @param {string} url Either a relative or absolute url
 * @return {object}
 */
export const getLinkPropsFromUrl = url => {
  const prop = /(?:https?:)?\/\//i.test(url) ? 'href' : 'to';
  return {
    [prop]: url,
  };
};
