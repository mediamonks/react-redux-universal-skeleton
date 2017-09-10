import { getDisplayName } from 'recompose';
import dashify from 'dashify';
import camelCase from 'camelcase';
import debugLib from 'debug';
import createFunctionalComponentWrapper from './createFunctionalComponentWrapper';

/**
 * Contains utilities to generate classnames for React components. One of these utilities should
 * be used on the root element of every component.
 *
 * @module
 * @category templating
 */

const debug = debugLib('componentClassNameUtils');

/**
 * A set of modifiers that will be appended to each component classname by
 * default. Adds a 'cid-{props.cid}' class when the 'cid' prop is passed to
 * a component.
 * @type {Array}
 */
const DEFAULT_MODIFIERS = ['cid-{cid}'];

/**
 * Utility to generate a className for a non-functional React component.
 *
 * It will add the following classes:
 *  - If the `cid` prop is passed to the component, it will add an
 *  'cid-{cid}' class
 *  - Classes based on the modifiers argument. See description below
 *
 * @function componentClassName
 * @param {object} componentInstance The instance of a react component.
 * In the `render()` function of a component, pass `this` as component instance.
 * @param {*} modifiers An object with modifiers may add additional classes.
 * Can be of one of the following types:
 *  - **object** An map of classes. The keys are class name strings
 *  (see below for syntax), and the values are conditions that determine if
 *  the classes are added. The condition can be either of the following:
 *     - **string** A string with the name of a prop that should be truthy.
 *     For example, adding the string `"foo.bar"` results in the class only
 *     to be added when a prop `foo` is passed to the component that has a
 *     truthy property `bar`. To lookup properties on React `state` or
 *     `context`, simply prefix the string like so: `"state.isActive"`,
 *     `"context.foo.bar"`. To invert the behavior, prefix the string with
 *     a `!` (for example, `"!disabled"`)
 *     - **function** A function that returns a boolean that determines if
 *     the class should be added. The function receives the following
 *     parameters:
 *       - **props** the component props
 *       - **context** the component context
 *       - **state** the component state
 *     - **Array** An Array that combines the above. All conditions in the
 *     array must be met in order for the class to be added.
 *     - **other** When passing any other type the class will be added when
 *     the value is truthy
 *  - **string** A string can be used as a shortcut for the object notation
 *    when the class name matches the prop name. For example, `"isActive"`
 *    will add an `is-active` class whenever a truthy `isActive` prop is
 *    passed to the component. Only the last property will be included in the
 *    class name, so `"state.input.hasFocus"` will result in a `has-focus`
 *    class to be added whenever there is an object `input` on the component
 *    state with a truthy property `hasFocus`.
 *  - **function** A function that returns a class or an array of classes
 *    to add. Receives the following parameters:
 *     - **props** the component props
 *     - **context** the component context
 *     - **state** the component state
 *  - **Array** An array that combines multiple of the types above
 *
 * **syntax for class names** all class names provided to the `modifier`
 * parameter will be converted to lowercase-with-dashes. A classname can
 * include dynamic property values. Wrapping a prop in curly braces will
 * cause the value to be inserted automatically. For example:
 * `"type-{type}"`, `"color-{state.color}"`, `"{context.theme}-theme"`. If
 * one of the properties is `undefined` or falsy, the class will not be added.
 *
 * @param {Array<string>} additionalClasses An array of additional classes
 * to add to the list of classnames. **This parameter is deprecated** and
 * included for backwards compatibility. It is recommended to add the
 * following modifier instead:
 * ```
 * () => (['foo', 'bar'])
 * ```
 * @returns {string} A className string
 * @example class MyComponent extends PureComponent {
 *   ...
 *   render() {
 *     return (
 *       <div className={componentClassName(
 *        this, ['isActive', 'color-{color}']
 *       )}>
 *         ...
 *       </div>
 *     );
 *   }
 * }
 *
 * MyComponent.propTypes = {
 *   isActive: PropTypes.bool,
 *   color: PropTypes.string.isRequired,
 * }
 */
export const componentClassName = (componentInstance, modifiers, additionalClasses) => {
  if (!componentInstance.constructor) {
    throw new Error('Unable to detect component name from given component instance');
  }
  const componentName = getDisplayName(componentInstance.constructor);
  if (componentName === 'Component') {
    throw new Error('Unable to detect component name from given component instance');
  }

  return generateComponentClassName(
    componentName,
    additionalClasses ? [() => additionalClasses].concat(modifiers || []) : modifiers,
    componentInstance,
    '',
  );
};

/**
 * Alternative syntax for `componentClassName`. See
 * {@link module:common/util/componentClassNameUtils~componentClassName
 * |componentClassName}
 * for a description of the parameters.
 *
 * @function componentClassNameProp
 * @see {@link componentClassName}
 * @returns {object} The className string wrapped in an object.
 * @example class MyComponent extends PureComponent {
 *   ...
 *   render() {
 *     return (
 *       <div {...componentClassNameProp(this,
 *       ['isActive', 'color-{color}'])}>
 *         ...
 *       </div>
 *     );
 *   }
 * }
 *
 * MyComponent.propTypes = {
 *   isActive: PropTypes.bool,
 *   color: PropTypes.string.isRequired,
 * }
 */
export const componentClassNameProp = (componentInstance, modifiers, additionalClasses) => ({
  className: componentClassName(componentInstance, modifiers, additionalClasses),
});

/**
 * Utility to generate a className for a functional React component.
 * **It is recommended to use the
 * {@link module:common/util/componentClassNameUtils~withFunctionalClassName|
 * withFunctionalClassName} util instead, which has a more compact syntax.**
 *
 * It will add the following classes:
 *  - If the `cid` prop is passed to the component, it will add an 'cid-{cid}'
 *  class
 *  - Classes based on the modifiers argument. See description below
 *
 * @function functionalComponentClassName
 * @deprecated
 * @param {string} componentName The name of the component. This is used to
 * generate the main
 * class and should exactly match the name of the component. It will be
 * automatically converted to lowercase-with-dashes
 * @param {object} props The props passed to the component. This is used for
 * processing the modifiers
 * @param {*} modifiers An object with modifiers may add additional classes.
 * Can be of one of the following types:
 *  - **object** An map of classes. The keys are class name strings
 *  (see below for syntax), and the values are conditions that determine if
 *  the classes are added. The condition can be either of the following:
 *     - **string** A string with the name of a prop that should be truthy.
 *     For example, adding the string `"foo.bar"` results in the class only
 *     to be added when a prop `foo` is passed to the component that has a
 *     truthy property `bar`. To lookup properties on React `state` or
 *     `context`, simply prefix the string like so: `"state.isActive"`,
 *     `"context.foo.bar"`. To invert the behavior, prefix the string with
 *     a `!` (for example,`"!disabled"`)
 *     - **function** A function that returns a boolean that determines if
 *     the class should be added. The function receives the following
 *     parameters:
 *       - **props** the component props
 *       - **context** the component context
 *       - **state** the component state
 *     - **Array** An Array that combines the above. All conditions in the
 *     array must be met in order for the class to be added.
 *     - **other** When passing any other type the class will be added when
 *     the value is truthy
 *  - **string** A string can be used as a shortcut for the object notation
 *  when the class name matches the prop name. For example, `"isActive"`
 *  will add an `is-active` class whenever a truthy `isActive` prop is
 *  passed to the component. Only the last property will be included in the
 *  class name, so `"state.input.hasFocus"` will result in a `has-focus`
 *  class to be added whenever there is an object `input` on the component state
 *  with a truthy property `hasFocus`.
 *  - **function** A function that returns a class or an array of classes
 *  to add. Receives the following parameters:
 *     - **props** the component props
 *     - **context** the component context
 *     - **state** the component state
 *  - **Array** An array that combines multiple of the types above
 *
 * **syntax for class names** all class names provided to the `modifier`
 * parameter will be converted to lowercase-with-dashes. A classname can
 * include dynamic property values. Wrapping a prop in curly braces will
 * cause the value to be inserted automatically. For example:
 * `"type-{type}"`, `"color-{state.color}"`, `"{context.theme}-theme"`. If
 * one of the properties is `undefined` or falsy, the class will not be added.
 *
 * @param {Array<string>} additionalClasses An array of additional classes
 * to add to the list of classnames. **This parameter is deprecated** and
 * included for backwards compatibility. It is recommended to add the
 * following modifier instead:
 * ```
 * () => (['foo', 'bar'])
 * ```
 * @param context The context passed to the component. This is used for
 * processing any modifiers that use context.
 * @returns {string} A className string
 * @example const MyComponent = (props, context) => {
 *   ...
 *   return (
 *     <div className={functionalComponentClassName(
 *       'MyComponent', props, ['isActive', 'color-{color}']
 *     )}>
 *       ...
 *     </div>
 *   );
 * };
 *
 * MyComponent.propTypes = {
 *   isActive: PropTypes.bool,
 *   color: PropTypes.string.isRequired,
 * }
 */
export const functionalComponentClassName = (
  // props is passed as third argument for backwards compatibility
  componentName,
  props,
  modifiers,
  additionalClasses,
  context = {},
) => {
  if (!props) {
    debug(
      'Usage of functionalComponentClassName without passing props is deprecated. Use withFunctionalClassName() wrapper to automatically pass props.',
    );
  }

  return generateComponentClassName(
    componentName,
    additionalClasses ? [() => additionalClasses].concat(modifiers || []) : modifiers,
    {
      props: props || {},
      context,
    },
    '',
  );
};

/**
 * Utility to generate a className for a functional React component.
 * This utility will return a function that will enhance a component by
 * providing a className string as a third parameter.
 * See the example below for usage.
 *
 * @function withFunctionalClassName
 * @param {string} componentName The name of the component. This is used to
 * generate the main class and should exactly match the name of the
 * component. It will be automatically converted to lowercase-with-dashes
 * @param {*} modifiers An object with modifiers may add additional classes.
 * Can be of one of the following types:
 *  - **object** An map of classes. The keys are class name strings (see
 *  below for syntax), and the values are conditions that determine if the
 *  classes are added. The condition can be either of the following:
 *     - **string** A string with the name of a prop that should be truthy.
 *     For example, adding the string `"foo.bar"` results in the class only
 *     to be added when a prop `foo` is passed to the component that has a
 *     truthy property `bar`. To lookup properties on React `state` or
 *     `context`, simply prefix the string like so: `"state.isActive"`,
 *     `"context.foo.bar"`. To invert the behavior, prefix the string with
 *     a `!` (for example,`"!disabled"`)
 *     - **function** A function that returns a boolean that determines if
 *     the class should be added. The function receives the following
 *     parameters:
 *       - **props** the component props
 *       - **context** the component context
 *       - **state** the component state
 *     - **Array** An Array that combines the above. All conditions in the
 *     array must be met in order for the class to be added.
 *     - **other** When passing any other type the class will be added when
 *     the value is truthy
 *  - **string** A string can be used as a shortcut for the object notation
 *  when the class name matches the prop name. For example, `"isActive"`
 *  will add an `is-active` class whenever a truthy `isActive` prop is
 *  passed to the component. Only the last property will be included in the
 *  class name, so `"state.input.hasFocus"` will result in a `has-focus`
 *  class to be added whenever there is an object `input` on the component state
 *  with a truthy property `hasFocus`.
 *  - **function** A function that returns a class or an array of classes
 *  to add. Receives the following parameters:
 *     - **props** the component props
 *     - **context** the component context
 *     - **state** the component state
 *  - **Array** An array that combines multiple of the types above
 *
 * **syntax for class names** all class names provided to the `modifier`
 * parameter will be converted to lowercase-with-dashes. A classname can
 * include dynamic property values. Wrapping a prop in curly braces will
 * cause the value to be inserted automatically. For example:
 * `"type-{type}"`, `"color-{state.color}"`, `"{context.theme}-theme"`. If
 * one of the properties is `undefined` or falsy, the class will not be added.
 * @returns {function} A function that will enhance a functional component by
 * passing
 * the className string as a third parameter.
 * @example const MyComponent = ({ foo, bar }, context, className) => (
 *   <div className={className}>
 *     ...
 *   </div>
 * );
 *
 * MyComponent.propTypes = {
 *   isActive: PropTypes.bool,
 *   color: PropTypes.string.isRequired,
 * }
 *
 * export default withFunctionalClassName(
 *   'MyComponent', ['isActive', 'color-{color}']
 * )(MyComponent);
 */
export const withFunctionalClassName = (componentName, modifiers) =>
  createFunctionalComponentWrapper(component => (props, context) =>
    component(props, context, functionalComponentClassName(componentName, props, modifiers)),
  );

const generateComponentClassName = (componentName, modifiers, componentInstance, prefix) =>
  DEFAULT_MODIFIERS.concat(modifiers || [])
    .reduce(
      (result, modifier) => result.concat(getClassNamesForModifier(modifier, componentInstance)),
      [componentNameToClass(componentName, prefix)],
    )
    .filter(_ => _)
    .join(' ');

const getClassNamesForModifier = (modifier, componentInstance) => {
  const typeofModifier = typeof modifier;
  switch (typeofModifier) {
    case 'string':
      return processModifier(modifier, modifier, componentInstance);
    case 'function': {
      const { props, context, state } = componentInstance;
      return modifier(props, context, state);
    }
    case 'object':
      if (Array.isArray(modifier)) {
        throw new Error('Unexpected Array inside Array passed to modifiers');
      }
      return Object.keys(modifier).map(className =>
        processModifier(className, modifier[className], componentInstance),
      );
    default:
      throw new TypeError(`Unexpected modifier of type "${typeofModifier}"`);
  }
};

const processModifier = (className, condition, componentInstance) =>
  meetsCondition(condition, componentInstance) && processClassName(className, componentInstance);

const meetsCondition = (condition, componentInstance) => {
  switch (typeof condition) {
    case 'string':
      return meetsStringCondition(condition, componentInstance);
    case 'function': {
      const { props, context, state } = componentInstance;
      return !!condition(props, context, state);
    }
    case 'object':
      if (Array.isArray(condition)) {
        return condition.every(subCondition => meetsCondition(subCondition, componentInstance));
      }
      return condition !== null;
    default:
      return !!condition;
  }
};

const processConditionSegment = camelCase;
const postProcessClassName = dashify;

const meetsStringCondition = (condition, componentInstance) => {
  if (condition.match(/{([a-zA-Z.]+)}/)) {
    // interpolation is checked in processClassName
    return true;
  }

  let invert = condition.startsWith('!');
  if (invert) {
    condition = condition.substring(1); // eslint-disable-line no-param-reassign
  }

  // eslint-disable-next-line no-param-reassign
  condition = condition.replace(/!?=/, equals => {
    debug('Syntax state=prop is deprecated. Use state.prop instead.');
    if (equals === '!=') {
      invert = !invert;
    }
    return '.';
  });

  const propSegments = condition.split('.');
  if (!['state', 'context', 'props'].includes(propSegments[0])) {
    propSegments.unshift('props');
  }

  const matches = !!propSegments.reduce(
    (result, segment) => result && result[processConditionSegment(segment)],
    componentInstance,
  );

  return (matches && !invert) || (!matches && invert);
};

const componentNameToClass = (componentName, prefix = 'component-') =>
  `${prefix}${dashify(componentName)}`;

const processClassName = (className, componentInstance) => {
  let hasMissingProp = false;

  const replacedClassNameSegments = className
    .replace(/{([a-zA-Z.]+)}/g, (match, prop) => {
      const propSegments = prop.split('.');

      if (!['state', 'context', 'props'].includes(propSegments[0])) {
        propSegments.unshift('props');
      }
      const value = propSegments.reduce(
        (result, segment) => result && result[segment],
        componentInstance,
      );
      hasMissingProp = hasMissingProp || typeof value === 'undefined' || value === null;
      return value;
    })
    .split('.');

  const replacedClassName = replacedClassNameSegments[replacedClassNameSegments.length - 1];

  return hasMissingProp ? false : postProcessClassName(replacedClassName);
};
