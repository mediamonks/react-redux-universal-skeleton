import CompositeInputFormatterError from '../CompositeInputFormatterError';

/**
 * Converts values from the WeightImperialFieldGroup without stones input into a
 * number value in pounds.
 *
 * @returns {number} The resulting number value in pounds
 */
const composeWeightImperial = ({ fullPounds, halfPounds }) => {
  if (typeof fullPounds === 'undefined' && typeof halfPounds === 'undefined') {
    return fullPounds;
  }
  const parsedPounds = fullPounds ? parseInt(fullPounds, 10) : 0;
  const parsedhalfPounds = halfPounds ? parseFloat(`0.${halfPounds}`) : 0;

  if (isNaN(parsedPounds)) {
    throw new CompositeInputFormatterError({ fullPounds: 'fullPounds should be a number' });
  }
  const wholePounds = Number(parsedhalfPounds) + Number(parsedPounds);
  return wholePounds;
};

export default composeWeightImperial;
