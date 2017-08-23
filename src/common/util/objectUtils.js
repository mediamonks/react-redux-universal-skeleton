/**
 * Retrieves properties from the given object.
 * @param target The object to retrieve the properties from.
 * @param {Array<string>} props An array of property names to retrieve. If a property
 * name has a dot in it, it will look up a nested property. For example, the string
 * `"foo.bar"` will look up the property `bar` on the property `foo` on the given
 * `target` object. If one of the parent properties in this string is not `typeof object`,
 * the value will be `undefined`.
 * @returns {Array} An array of values in the same order as the values passed to the
 * `props` parameter.
 */
export const extractPropsFromObject = (target, props) =>
  props.map(prop => {
    const segments = prop.split('.');

    if (segments.length < 2) {
      return target[prop];
    }

    return segments.reduce((result, segment) => {
      if (typeof result !== 'object') {
        return undefined;
      }

      return result[segment];
    }, target);
  });

/**
 * Converts an array of property names with an array of corresponding values to an
 * object.
 * @param {Array<string>} propNames An array of property names. A dot in the property
 * name indicates nesting. For example, the property name `"foo.bar"` indicates that
 * the result should have an object `foo` with the property `bar`.
 * @param {Array} propValues An array of values that correspond to the property names
 * in the `propNames` array.
 * @returns {object} The result object
 */
export const propNameValuesToObject = (propNames, propValues) =>
  propNames.reduce((result, propName, index) => {
    const segments = propName.split('.');

    if (segments.length < 2) {
      result[propName] = propValues[index]; // eslint-disable-line no-param-reassign
    } else {
      const finalPropName = segments.pop();
      let target = result;
      segments.forEach(segment => {
        if (typeof target[segment] !== 'object') {
          target[segment] = {};
        }

        target = target[segment];
      });
      target[finalPropName] = propValues[index];
    }

    return result;
  }, {});
