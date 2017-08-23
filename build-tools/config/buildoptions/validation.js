const util = require('util');

module.exports = {
  isNumber: function(value) {
    return typeof value === 'number';
  },
  isString: function(value) {
    return typeof value === 'string';
  },
  isBoolean: function(value) {
    return typeof value === 'boolean';
  },
  isArray: function(value) {
    return typeof value === 'object' && util.isArray(value);
  },
  isArrayOf: function(validation) {
    return function(value) {
      if (typeof value !== 'object' || !util.isArray(value)) {
        return false;
      }
      for (var i = 0; i < value.length; i++) {
        if (!validation(value[i])) {
          return false;
        }
      }
      return true;
    };
  },
  isObject: function(value) {
    return typeof value === 'object' && util.isObject(value);
  },
  optional: function(validation) {
    var optionalValidation = function(value) {
      return validation(value);
    };
    optionalValidation.isOptional = true;
    return optionalValidation;
  },
};
