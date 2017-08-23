/**
 * Utilities to format phone numbers according to a certain locale
 * @module
 * @category forms
 */

/**
 * Automatically put dashes when typing the phone number for US market
 *
 * @param phoneNumber
 * @returns {*}
 */
export const formatUsPhoneNumber = phoneNumber => {
  if (!phoneNumber) {
    return phoneNumber;
  }

  return phoneNumber.replace(/[^0-9]/g, '').replace(/^(.{1,3})?(.{1,3})?(.*)/, (_, m1, m2, m3) => {
    let formatted = '';

    if (m1) {
      formatted += m1;
    }
    if (m2) {
      formatted += `-${m2}`;
    }
    if (m3) {
      formatted += `-${m3}`;
    }

    return formatted;
  });
};

/**
 * todo implement UK market phone number formatter
 * @param phoneNumber
 * @returns {*}
 */
export const formatUkPhoneNumber = phoneNumber => phoneNumber;
