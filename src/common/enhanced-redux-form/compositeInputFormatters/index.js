import composeDate from './composeDate';
import decomposeDate from './decomposeDate';
import composeHeightMetricToImperial from './composeHeightMetricToImperial';
import composeHeightImperial from './composeHeightImperial';
import composeWeightMetricToImperial from './composeWeightMetricToImperial';
import composeWeightImperialWithStones from './composeWeightImperialWithStones';
import composeWeightImperial from './composeWeightImperial';
import composeCheckboxesToBitwise from './composeCheckboxesToBitwise';
import decomposeCheckboxesToBitwise from './decomposeCheckboxesToBitwise';
import composeCheckboxesToArray from './composeCheckboxesToArray';
import decomposeCheckboxesToArray from './decomposeCheckboxesToArray';

/**
 * Formatter functions that can be used to combine multiple form values into a single
 * value using the `<CompositeInput />` component.
 * @module enhanced-redux-form/compositeInputFormatters
 * @category forms
 */

/**
 * Object with definitions of formatter methods to combine multiple inputs into
 * a single value. Can be used as value for the 'formatter' prop of the
 * CompositeInput component.
 *
 * Please note: this object is patched at the bottom of this file to include the keys
 * in the values.
 */
const formatters = {
  DATE: {
    compose: composeDate,
    decompose: decomposeDate,
  },
  HEIGHT_CM_TO_FEET: { compose: composeHeightMetricToImperial },
  HEIGHT_FEET: { compose: composeHeightImperial },
  WEIGHT_KILO_TO_POUNDS: { compose: composeWeightMetricToImperial },
  WEIGHT_STONES_POUNDS: { compose: composeWeightImperialWithStones },
  WEIGHT_POUNDS: { compose: composeWeightImperial },
  CHECKBOXES_TO_BITWISE: {
    compose: composeCheckboxesToBitwise,
    decompose: decomposeCheckboxesToBitwise,
  },
  CHECKBOXES_TO_ARRAY: {
    compose: composeCheckboxesToArray,
    decompose: decomposeCheckboxesToArray,
  },
};

// Patch the formatters object so the name can be extracted from each value
Object.keys(formatters).forEach(name => {
  formatters[name] = {
    name,
    formatter: formatters[name],
  };
});

export default formatters;
