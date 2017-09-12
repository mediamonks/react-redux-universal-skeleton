const argv = require('yargs').argv;
const camelCase = require('camelcase');
const path = require('path');
const defaults = require('./default.buildoptions');
const util = require('util');
const environmentPrefix = 'SW_BUILD_';

class BuildOptionsManager {
  constructor() {
    this.valueCache = {};
    this.mergedValueCache = {};
    this.injectedValues = {};
    this.getCliValue = name => argv[name];
    this.getInjectedValue = name => this.injectedValues[camelCase(name)];
    this.getDefaultValue = name => defaults[camelCase(name)];

    this.configurationSources = [
      new BuildOptionsSource('cli', this.getCliValue),
      new BuildOptionsSource('environment', this.getEnvironmentValue),
      new BuildOptionsSource('injected', this.getInjectedValue),
      new BuildOptionsSource('defaults', this.getDefaultValue),
    ];
  }

  forbidOptionCombination(optionMap, errorMessage) {
    const hasCombination = Object.keys(optionMap).every(
      optionKey => this.getValue(optionKey) == optionMap[optionKey]
    );

    if (hasCombination) {
      throw new Error(`Invalid build configuration: ${errorMessage}`);
    }
  }

  getValue(name, options) {
    if (typeof options === 'undefined') {
      options = {};
    }

    const valueCache = options.merge ? this.mergedValueCache : this.valueCache;
    if (typeof valueCache[name] === 'undefined') {
      const value = this.getValueNoCache(name, options);
      valueCache[name] = options.isPath ? path.resolve(value) : value;
    }

    return valueCache[name];
  }

  getValueNoCache(name, options) {
    const results = [];

    for (let i = 0; i < this.configurationSources.length; i++) {
      const source = this.configurationSources[i];
      const sourceValue = source.getValue.call(this, name, options);
      if (typeof sourceValue !== 'undefined') {
        // we add the results in reverse order because when merging the earlier ones should override
        results.unshift({
          source: source.name,
          value: sourceValue,
        });
        if (!options.merge) {
          break;
        }
      }
    }

    if (!results.length) {
      throw new Error(`BuildOptionsManager: missing config value "${name}"`);
    }
    const lastResult = results[results.length - 1];

    if (options.merge) {
      if (typeof lastResult.value === 'object') {
        if (util.isArray(lastResult.value)) {
          return results
            .map(function(result) {
              return result.value;
            })
            .reduce(function(prev, result) {
              return prev.concat(result);
            });
        }

        return results
          .map(result => result.value)
          .reduce((mergedResult, result) => Object.assign(mergedResult, result));
      } else {
        return lastResult.value;
      }
    }

    return lastResult.value;
  }

  getEnvironmentValue(name) {
    const environmentName = environmentPrefix + name.toUpperCase().replace(/-/g, '_');
    const environmentValue = process.env[environmentName];
    return environmentValue === 'false' ? false : environmentValue;
  }

  injectValues(values) {
    Object.keys(values).forEach(valueKey => {
      this.injectedValues[camelCase(valueKey)] = values[valueKey];
    });
  }
}

/**
 * Defines a configuration source for getValue
 * @param name {string} The name of the configuration source (for debugging)
 * @param getValue {function} A function that gets a configuration value for
 * a given name
 * @constructor
 */
class BuildOptionsSource {
  constructor(name, getValue) {
    this.name = name;
    this.getValue = getValue;
  }
}

module.exports = BuildOptionsManager;
