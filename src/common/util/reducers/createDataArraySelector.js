import { createSelectorCreator, defaultMemoize } from 'reselect';

/**
 * Custom memoization function for makeMemoizedGetEntities(). It runs through
 * both arrays of objects and checks if the data property inside them is the same (strict equality)
 *
 * @function createDataArraySelector
 */
const createDataArraySelector = createSelectorCreator(
  defaultMemoize,
  (listA, listB) =>
    listA.length === listB.length &&
    listA.every(
      (item, index) =>
        (typeof item === 'number' && item === listB[index]) || item.data === listB[index].data,
    ),
);

export default createDataArraySelector;
