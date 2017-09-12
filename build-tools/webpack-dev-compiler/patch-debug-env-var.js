/**
 * Patches the DEBUG environment variable to ensure that React debug statements
 * are shown during development.
 */
const NAMESPACE_TO_ADD = 'React:*';
const currentDebug = process.env['DEBUG'] || '';
const namespaces = currentDebug.split(',');

if (namespaces.length === 1 && !namespaces[0]) {
  namespaces.length = 0;
}

if (namespaces.indexOf(NAMESPACE_TO_ADD) === -1) {
  console.log(
    'Could not find "' +
      NAMESPACE_TO_ADD +
      '" in DEBUG environment variable. \nPatching it manually for development.\n'
  );
  namespaces.push(NAMESPACE_TO_ADD);
  process.env['DEBUG'] = namespaces.join(',');
}
