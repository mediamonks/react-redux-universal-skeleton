import CompositeInputFormatterError from '../CompositeInputFormatterError';

/**
 * Converts values from the HeightImperialFieldGroup input into a number value in feet
 * @param {object} formValues
 * @param {string} formValues.feet An string that contains an integer representing
 * the amount of feet
 * @param {string} formValues.inches A string that contains an integer representing
 * the amount of inches
 *
 * @returns {number} The resulting number value in feet
 */
const composeHeightImperial = ({ feet, inches }) => {
  if (typeof feet === 'undefined' && typeof inches === 'undefined') {
    return feet;
  }
  const parsedFeet = feet ? parseInt(feet, 10) : 0;
  const parsedInches = inches ? parseInt(inches, 10) : 0;
  if (isNaN(parsedFeet)) {
    throw new CompositeInputFormatterError({ feet: 'Feet should be a number' });
  }
  if (isNaN(parsedInches)) {
    throw new CompositeInputFormatterError({ inches: 'Inches should be a number' });
  }
  if (parsedInches >= 12) {
    throw new CompositeInputFormatterError({ inches: 'Inches should be smaller than 12' });
  }
  return parsedFeet * 12 + parsedInches;
};

export default composeHeightImperial;
