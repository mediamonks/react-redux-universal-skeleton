import CompositeInputFormatterError from '../CompositeInputFormatterError';

/**
 * Converts values from the WeightMetricFieldGroup input into a number value in pounds
 * @param {object} formValues
 * @param {string} formValues.kilos An string that contains an integer representing
 * the amount of kilos
 * @param {string} formValues.grams A string that contains an integer representing
 * the amount of grams
 *
 * @returns {number} The resulting number value in pounds
 */
const composeWeightMetricToImperial = ({ kilos, grams }) => {
  if (typeof kilos === 'undefined') {
    return kilos;
  }

  const parsedKilograms = kilos ? parseInt(kilos, 10) : 0;
  const parsedhalfKilograms = grams ? parseFloat(`0.${grams}`) : 0;

  if (isNaN(parsedKilograms)) {
    throw new CompositeInputFormatterError('Kilograms should be a number');
  }
  if (parsedhalfKilograms >= 99) {
    throw new CompositeInputFormatterError({ fullKilograms: 'grams should be smaller than 99' });
  }

  const wholeKilograms = Number(parsedhalfKilograms + parsedKilograms);
  return wholeKilograms * 2.20462;
};

export default composeWeightMetricToImperial;
