const loaderUtils = require('loader-utils');
const objectAssign = require('object-assign');

module.exports = function(content) {
  const options = loaderUtils.getOptions(this);
  const configJsonPaths = options.jsons;
  const loaderContext = this;
  const done = this.async();
  this.cacheable();

  if (!configJsonPaths) {
    done(new Error('No configPath option provided to config-injector-loader'), null);
  }

  var configValues = {};
  configJsonPaths.forEach(function(path) {
    try {
      objectAssign(configValues, require(path));
    } catch (e) {
      done(new Error('Could not import config file at "' + path + '": ' + e.message), null);
    }

    loaderContext.addDependency(path);
  });

  this.resolve(this.context, this.resourcePath, function(err, resolvedResourcePath) {
    if (err) {
      done(err, null);
      return;
    }

    const configDefinition = require(resolvedResourcePath);
    const configId = configDefinition.id;
    if (typeof configId === 'undefined') {
      done(
        new Error(
          'Config definitions file is missing an id property. \n(at ' + resolvedResourcePath + ')'
        ),
        null
      );
      return;
    }

    const targetConfigValues = configValues[configId];
    if (typeof targetConfigValues !== 'object') {
      done(
        new Error(
          'No configuration values defined for id "' +
            configId +
            '". \n(at ' +
            resolvedResourcePath +
            ')'
        ),
        null
      );
      return;
    }

    try {
      validateConfiguration(configDefinition, targetConfigValues, configId);
    } catch (e) {
      done(e, null);
      return;
    }

    const configOutput = 'module.exports = ' + JSON.stringify(targetConfigValues, null, '  ') + ';';
    done(null, configOutput);
  });
};

function validateConfiguration(configDefinition, targetConfigValues, path) {
  for (var i in configDefinition) {
    if (configDefinition.hasOwnProperty(i) && i !== 'id') {
      var subPath = path + '.' + i;
      if (typeof configDefinition[i] === 'object') {
        if (typeof targetConfigValues[i] !== 'object') {
          throw new Error('Missing configuration object with key "' + subPath + '"');
        }

        validateConfiguration(configDefinition[i], targetConfigValues[i], subPath);
        continue;
      }

      if (typeof configDefinition[i] !== 'function') {
        throw new Error(
          'Unknown type found in .configdefinitions file. Expected a function or an object for "' +
            subPath +
            '"'
        );
      }

      if (typeof targetConfigValues[i] === 'undefined') {
        if (configDefinition[i].isOptional) {
          continue;
        }
        throw new Error('Missing configuration value with key "' + subPath + '"');
      }

      if (!configDefinition[i](targetConfigValues[i])) {
        throw new Error(
          'Configuration value with key "' +
            subPath +
            '" does not validate against the validation function in .configdefinitions file.'
        );
      }
    }
  }
}
