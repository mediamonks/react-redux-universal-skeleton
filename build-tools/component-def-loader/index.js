const COMPONENT_DEF_CONST = 'WP_COMPONENT_DEF';

module.exports = function(content) {
  const hasComponentDef = content.indexOf(COMPONENT_DEF_CONST) >= 0;

  if (!hasComponentDef) {
    return content;
  }

  const resourceDirs = this.resourcePath.split(/[\\/]/g);
  const shortResourceName = resourceDirs.slice(-3).join('/');
  const genericErrorMessage =
    'component at "' +
    shortResourceName +
    '" used constant ' +
    COMPONENT_DEF_CONST +
    ' but the component ';

  let nameMatch = [];
  if (hasComponentDef) {
    nameMatch = this.resourcePath.match(/[\/\\]([0-9]*[A-Z][^\\/\-]+)[\/\\]\1\.jsx?$/);
    if (!nameMatch) {
      throw new Error(genericErrorMessage + 'did not follow the filename convention ComponentName/ComponentName.js');
    }
  }

  const defRegex = new RegExp(COMPONENT_DEF_CONST, 'g');
  return content.replace(defRegex, "'" + nameMatch[1] + "'");
};
