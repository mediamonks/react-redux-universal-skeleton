import CompositeInputFormatterError from '../CompositeInputFormatterError';

/**
 * Converts values from the HeightMetricFieldGroup input into a number value in feet
 * @param {object} formValues
 * @param {string} formValues.meters An string that contains an integer representing
 * the amount of meters
 * @param {string} formValues.centimeters A string that contains an integer representing
 * the amount of centimeters
 *
 * @returns {number} The resulting number value in feet
 */
const composeHeightMetricToImperial = ({ meters, centimeters }) => {
  if (typeof meters === 'undefined' && typeof centimeters === 'undefined') {
    return meters;
  }

  const parsedMeters = meters ? parseInt(meters, 10) : 0;
  const parsedCentimeters = centimeters ? parseFloat(`0.${centimeters}`) : 0;

  if (isNaN(parsedMeters)) {
    throw new CompositeInputFormatterError('Meters should be a number');
  }
  if (parsedCentimeters > 99) {
    throw new CompositeInputFormatterError({
      centimeters: 'Centimeters should be smaller than 99',
    });
  }

  const wholeMeters = Number(parsedMeters + parsedCentimeters) * 100;
  return wholeMeters / 2.54;
};

export default composeHeightMetricToImperial;
