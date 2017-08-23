/**
 * Holds a JSON encoded version of the response, that is cached internally until it expires.
 */
class CachedCall {
  createdAt;

  /**
   * @constructor
   * @param {string} key
   * @param {any} result
   * @param {number} maxAge In Seconds
   */
  constructor(key, result, maxAge = 60) {
    this.key = key;
    this.result = result;
    this.maxAge = maxAge;
    this.createdAt = +new Date();
  }

  /**
   * The current age of the saved data
   *
   * @returns {number}
   */
  getAge() {
    return (+new Date() - this.createdAt) / 1000;
  }

  /**
   * Checks if the call is expired by comparing the age with the max-age of the data.
   *
   * @returns {boolean}
   */
  isExpired() {
    return this.maxAge !== Number.POSITIVE_INFINITY && this.getAge() > this.maxAge;
  }
}

export default CachedCall;
