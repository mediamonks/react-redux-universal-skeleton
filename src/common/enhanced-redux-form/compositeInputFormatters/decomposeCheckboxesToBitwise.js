/**
 * Decomposes the value composed by composeCheckboxesToBitwise().
 *
 * @see composeCheckboxesToBitwise
 * @param {number|string} bitwise The combined bitwise value
 * @param {object} currentValues The current values of the checkboxes
 * @returns {object} An object containing individual values for checkboxes
 */
const decomposeCheckboxesToBitwise = (bitwise, currentValues = {}) => {
  const bitwiseNumber = typeof bitwise === 'number' ? bitwise : parseInt(bitwise, 10);
  const newValues = {};
  if (isNaN(bitwiseNumber)) {
    throw new Error(`Could not decompose bitwise value. Value ${bitwise} is NaN`);
  }

  Object.keys(currentValues).forEach(key => {
    newValues[key] = null;
  });

  // eslint-disable-next-line no-bitwise
  for (let i = 0; 1 << i <= bitwiseNumber; i++) {
    newValues[i] = (1 << i) & bitwiseNumber ? true : null; // eslint-disable-line no-bitwise
  }

  return newValues;
};

export default decomposeCheckboxesToBitwise;
