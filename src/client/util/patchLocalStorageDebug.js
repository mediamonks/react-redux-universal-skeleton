import debugLib, { enable, load } from 'debug';

const NAMESPACE_TO_ADD = 'React:*';

/**
 * Patches the debug variable on localStorage to ensure that React debug
 * statements
 * are shown during development.
 */
function patchLocalStorageDebug() {
  if (typeof localStorage !== 'undefined') {
    let currentDebug = '';
    try {
      currentDebug = load() || '';
    } catch (e) {
      // localStorage not supported (incognito browsing)
    }
    const namespaces = currentDebug.split(',');

    if (namespaces.length === 1 && !namespaces[0]) {
      namespaces.length = 0;
    }

    if (namespaces.indexOf(NAMESPACE_TO_ADD) === -1) {
      /* eslint-disable no-console */
      console.log(`Could not find "${NAMESPACE_TO_ADD}" in debug localStorage variable.`);
      console.log('Patching it for development.');
      console.log('(refresh page to see debug statements)');
      /* eslint-enable no-console */
      namespaces.push(NAMESPACE_TO_ADD);

      try {
        enable(namespaces.join(','));
        const debug = debugLib('React:patch');
        debug('patched debug!');
      } catch (e) {
        // localStorage not supported (incognito browsing)
      }
    }
  }
}

export default patchLocalStorageDebug;
