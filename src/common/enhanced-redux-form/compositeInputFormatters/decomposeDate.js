import moment from 'moment';

/**
 * Convert a combined date string back into separate day, month and year input
 * values
 * @param {string} dateString A date string formatted as 'YYYY-MM-DD', optionally postfixed
 * with T00:00:00Z
 * @returns {{day: string, month: string, year: string}} The input values
 */
const decomposeDate = inputDateString => {
  if (!inputDateString) {
    return {
      day: '',
      month: '',
      year: '',
    };
  }
  const dateString = inputDateString.replace(/T[0-9:]+Z?$/, '');

  const date = moment(dateString, 'YYYY-MM-DD');
  if (!date.isValid()) {
    throw new Error(`Date string value could not be parsed to date: ${dateString}`);
  }

  return {
    day: date.date().toString(),
    month: (date.month() + 1).toString(),
    year: date.year().toString(),
  };
};

export default decomposeDate;
