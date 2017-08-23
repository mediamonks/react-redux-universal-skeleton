module.exports = function(contents) {
  this.cacheable && this.cacheable();

  return contents.replace(/bundle(-loader)?\?[^!]*reactHot.*?!/g, '');
};
