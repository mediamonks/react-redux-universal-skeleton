import { Component, PropTypes } from 'react';
import debugLib from 'debug';

const debug = debugLib('React:FormRouteSync');

/**
 * Utility component that syncs the form values of the form it is placed in
 * to the route query string. When the fields given to the `fields` prop change value,
 * the component calls the `syncValuesToRoute` action, which will update the route
 * to match the values.
 *
 * Note: this util works one-way. It will not sync updates in the query back to the form
 * values.
 */
class FormRouteSync extends Component {
  componentWillReceiveProps({ values }) {
    const { values: oldValues, syncValuesToRoute, transformValues } = this.props;

    if (Object.keys(values).some(key => values[key] !== oldValues[key])) {
      debug('Detected form value change. Updating route...');
      syncValuesToRoute(transformValues ? transformValues(values) : values);
    }
  }

  render() {
    return null;
  }
}

FormRouteSync.propTypes = {
  /**
   * The names of the fields to sync to the query string
   */
  // eslint-disable-next-line react/no-unused-prop-types
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
  /**
   * The current form values of the fields. Provided by the `connect()` redux wrapper
   */
  values: PropTypes.objectOf(PropTypes.any),
  /**
   * An optional function to transform the values object before syncing it to the route.
   * Should accept an object with values and return a new object with modifications.
   */
  transformValues: PropTypes.func,
  /**
   * The action to sync values to route. Provided by the `connect()` redux wrapper
   */
  syncValuesToRoute: PropTypes.func.isRequired,
};

FormRouteSync.defaultProps = {
  transformValues: null,
  values: null,
};

export default FormRouteSync;
