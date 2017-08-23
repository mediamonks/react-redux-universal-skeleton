import moment from 'moment';
import CompositeInputFormatterError from '../CompositeInputFormatterError';

/**
 * Composes the values of the DateFieldGroup inputs into a single date string
 * @param {object} values
 * @param {string} values.day A string containing an integer value representing the day number
 * @param {string} values.month A string containing an integer value representing the month number
 * @param {string} values.year A string containing an integer value representing the year number
 * @returns {string} A date string formatted as YYYY-MM-DD postfixed with T00:00:00Z (because
 * backend expects a timezone indication)
 */
const composeDate = values => {
  const segments = ['day', 'month', 'year'];
  let validationErrors;
  if (segments.some(segment => typeof values[segment] === 'undefined' || values[segment] === '')) {
    return '';
  }

  const segmentRegexps = {
    day: /^(?:0?[1-9]|[1-2][0-9]|3[0-1])$/,
    month: /^(?:0?[1-9]|1[0-2])$/,
    year: /^(?:(?:19|20)[0-9]{2})$/,
  };
  // check regexp for individual segments
  validationErrors = segments.reduce((errors, segment, index) => {
    if (!segmentRegexps[segment].test(values[segment])) {
      // eslint-disable-next-line no-param-reassign
      errors[segments[index]] = `Please enter a valid number for ${segments[index]}.`;
    }
    return errors;
  }, {});
  if (Object.keys(validationErrors).length) {
    throw new CompositeInputFormatterError(validationErrors);
  }

  // check for integer values
  const integers = segments.map(segment => parseInt(values[segment], 10));
  validationErrors = integers.reduce((errors, value, index) => {
    if (isNaN(value)) {
      // eslint-disable-next-line no-param-reassign
      errors[segments[index]] = `Please enter a valid number for ${segments[index]}.`;
    }
    return errors;
  }, {});
  if (Object.keys(validationErrors).length) {
    throw new CompositeInputFormatterError(validationErrors);
  }

  // We subtract 1 from month because moment months are 0-indexed
  const parsed = moment({
    y: integers[segments.indexOf('year')],
    M: integers[segments.indexOf('month')] - 1,
    d: integers[segments.indexOf('day')],
  });
  if (!parsed.isValid()) {
    throw new CompositeInputFormatterError('Please enter a valid date.');
  }
  return `${parsed.format('YYYY-MM-DD')}T00:00:00Z`;
};

export default composeDate;
