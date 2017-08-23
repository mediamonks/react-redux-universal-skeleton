/* eslint-disable import/prefer-default-export */

/** @module */

/**
 * Builds a path from a template and replaces the params
 *
 * @function createPath
 * @param path The configured path (e.g. /foo/:bar)
 * @param params The param values you want to replace it with (e.g. \{bar: 'baz'\})
 * @category routing
 */
export const createPath = (path, params = {}) =>
  path
    // first replace all params
    .replace(/:(\w+)/g, (match, param) => {
      if (typeof params[param] !== 'undefined') {
        return params[param] || '';
      }
      return match;
    })
    // remove parenthesis for resolved optional parts
    .replace(/\(([^:]+?)\)/g, (match, part) => part)
    // remove the other (unresolved) optional parts
    .replace(/\(.+?\)/g, () => '')
    // do we still have params left?
    .replace(/:(\w+)/g, (match, param) => {
      throw new Error(`Param "${param}" is missing in params ${params}, needed for '${path}'`);
    });
