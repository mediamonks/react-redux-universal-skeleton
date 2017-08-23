import debugLib from 'debug';

const debug = debugLib('React:HotReloader');

export default class HotReloader {
  checkUpdates(fromUpdate) {
    const status = module.hot.status();
    if (status !== 'idle') {
      debug(`Got signal but currently in ${status} state.`);
      debug('Need to be in idle state to start hot update.');
      return;
    }

    module.hot
      .check()
      .then(updatedModules => {
        if (!updatedModules) {
          debug(fromUpdate ? 'Update applied.' : 'Cannot find update');
          return null;
        }

        return module.hot
          .apply({
            ignoreUnaccepted: true,
            ignoreDeclined: true,
            ignoreErrored: true,
            onUnaccepted: data =>
              debug(`Ignored an update to unaccepted module ${data.chain.join(' -> ')}`),
            onDeclined: data =>
              debug(`Ignored an update to declined module ${data.chain.join(' -> ')}`),
            onErrored: data =>
              debug(`Ignored an error while updating module ${data.moduleId}(${data.type})`),
          })
          .then(renewedModules => {
            logWebpackHotApplyResults(updatedModules, renewedModules);
            this.checkUpdates(true);
          });
      })
      .catch(err => {
        const newStatus = module.hot.status();
        if (['abort', 'fail'].indexOf(newStatus) >= 0) {
          debug('Cannot apply udpate.');
          debug(err.stack || err.message);
          debug('You need to restart the application!');
        } else {
          debug(`Update failed: ${err.stack || err.message}`);
        }
      });
  }
}

function logWebpackHotApplyResults(updatedModules, renewedModules) {
  const unacceptedModules = updatedModules.filter(
    moduleId => renewedModules && renewedModules.indexOf(moduleId) < 0,
  );

  if (unacceptedModules.length > 0) {
    debug("The following modules couldn't be hot updated: (They would need a full reload!)");
    unacceptedModules.forEach(logModuleId);
  }

  if (!renewedModules || renewedModules.length === 0) {
    debug('Nothing hot updated.');
  } else {
    debug('Updated modules:');
    renewedModules.forEach(logModuleId);
  }
}

function logModuleId(moduleId) {
  if (typeof moduleId === 'string') {
    const moduleName = moduleId.split('!').pop();
    debug(` - ${moduleName}`);
  } else {
    debug(` - ${moduleId}`);
  }
}
