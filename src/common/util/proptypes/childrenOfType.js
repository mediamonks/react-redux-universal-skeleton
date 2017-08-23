import { Children } from 'react';

/** @module */

const childrenOfType = components => {
  const wrappedTypeChecker = isRequired => {
    const displayNames = components.map(component => component.displayName);
    const names = components.map(component => component.name);

    return (props, propName, componentName) => {
      if (isRequired) {
        if (props[propName] === null || typeof props[propName] === 'undefined') {
          return new Error(
            `The '${propName}' is marked as required in ${componentName} but its value is null or undefined`,
          );
        }
      }

      const children = Children.toArray(props[propName]);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (
          !components.includes(child.type) &&
          !displayNames.includes(child.type.displayName) &&
          !names.includes(child.type.name)
        ) {
          const componentNames = JSON.stringify(
            components.map(comp => comp.displayName || comp.name),
          );
          return new Error(
            `Expected ${propName} of ${componentName} to be one of ${componentNames} but got type "${child.type &&
              (child.type.displayName || child.type.name)}" instead`,
          );
        }
      }

      return null;
    };
  };

  const typeChecker = wrappedTypeChecker(false);
  typeChecker.isRequired = wrappedTypeChecker(true);
  return typeChecker;
};

/**
 * Returns a propType checker that checks if the passed children are of one of the provided
 * component types.
 * @function childrenOfType
 * @param {Array} components An array of React components which are allowed
 * @example MyComponent.propTypes = {
 *   children: childrenOfType([SomeComponent, SomeOtherComponent]),
 * }
 * @category templating
 */
export default childrenOfType;
