import PropTypes from 'prop-types';

const { bool, shape, object, string, oneOfType } = PropTypes;

/** @module */

/**
 * Default PropTypes that can be applied to a component that is wrapped in `EnhancedField`
 * @const formFieldPropTypes
 * @type {{input, label, showError, meta}}
 * @category forms
 */
const formFieldPropTypes = {
  input: object,
  label: string,
  showError: bool,
  meta: shape({
    touched: bool,
    error: oneOfType([
      shape({
        message: oneOfType([
          PropTypes.string,
          PropTypes.shape({
            locale: PropTypes.string.isRequired,
            params: PropTypes.objectOf(PropTypes.any),
          }),
        ]),
        code: string,
      }),
      string,
    ]),
  }),
};

export default formFieldPropTypes;
