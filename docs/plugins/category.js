const categories = require('../categories/categories.json');

exports.defineTags = (dictionary) => {
  dictionary.defineTag('category', {
    mustHaveValue: true,
    isNamespace: false,
    onTagged: (doclet, tag) => {
      const tagValue = tag.value;
      const tagValueSplit = tagValue.split(/, ?/g);

      tagValueSplit.forEach((value) => {
        const categoryConfig = categories[value];

        if (!categoryConfig) {
          throw new Error(`Category "${tag.value}" is not defined in categories.json`);
        }
      });

      doclet.category = tagValueSplit; // eslint-disable-line no-param-reassign
    },
  });
};
