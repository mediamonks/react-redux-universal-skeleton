import CompositeInputFormatterError from '../CompositeInputFormatterError';

/**
 * Converts values from the WeightImperialFieldGroup with stones input into a
 * number value in pounds.
 *
 * @returns {number} The resulting number value in pounds
 */
const composeWeightImperialWithStones = ({ stones, fullPounds, halfPounds }) => {
  if (typeof stones === 'undefined' && typeof fullPounds === 'undefined') {
    return stones;
  }
  const parsedStones = stones ? parseInt(stones, 10) : 0;
  const parsedPounds = fullPounds ? parseInt(fullPounds, 10) : 0;
  const parsedhalfPounds = halfPounds ? parseFloat(halfPounds).toFixed(2) : 0;

  if (isNaN(parsedStones)) {
    throw new CompositeInputFormatterError({ stones: 'stones should be a number' });
  }
  if (isNaN(parsedPounds)) {
    throw new CompositeInputFormatterError({ fullPounds: 'fullPounds should be a number' });
  }
  if (parsedPounds >= 14) {
    throw new CompositeInputFormatterError({ fullPounds: 'fullPounds should be smaller than 14' });
  }
  const wholePounds = Number(parsedhalfPounds) + Number(parsedPounds);
  // There are 14 pounds in each stone this add together wholepounds and converts
  return wholePounds + parsedStones * 14;
};

export default composeWeightImperialWithStones;
