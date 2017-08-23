const STRIP_KEY = '_strip_';

/**
 * Strips private fields out of the environmentConfig using the top-level _strip_ array of paths
 * A new object will be returned without the keys on it.
 * The _strip_ array is defined in default.json.
 *
 * @function stripPrivateEnvironmentConfig
 * @param {object} config The config object, also containing the _strip_ list.
 * @param {Array<string>} [parentKeys] A list of keys (from the parent) to strip
 * @param {Array<string>} [path] The current path in the nested object
 * @return {*} The object without the stripped keys
 */
const stripPrivateEnvironmentConfig = (config, parentKeys = [], path = []) => {
  if (typeof config !== 'object') {
    return config;
  }

  const secureConfig = {};
  // TODO, when appending strip-keys on a nested object, it should prepend the current nested path
  const keysToStrip = (config[STRIP_KEY] || []).concat(parentKeys);

  Object.keys(config).forEach(configKey => {
    const currentPath = path.concat(configKey);
    if (configKey !== STRIP_KEY && !keysToStrip.includes(currentPath.join('.'))) {
      secureConfig[configKey] = stripPrivateEnvironmentConfig(
        config[configKey],
        keysToStrip,
        currentPath,
      );
    }
  });

  return secureConfig;
};

export default stripPrivateEnvironmentConfig;
