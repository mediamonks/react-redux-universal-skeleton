```
// https://github.com/reactjs/reselect
import { createSelector } from 'reselect';

// helper function that selects fields from the state or passes from props
// used in other selectors
const getArticle = (state, props) => (
  props && props.id || state.currentArticle.id
);

// normal selector, end with `Selector`
export const getArticleSelector = createSelector(
    [getArticle],
    (article) =>
      article
);

// function that returns a selector, to be used across multiple components
// this will make sure each seletor will be memoized on its own
// start with `make` and end with `Selector`
// https://github.com/reactjs/reselect#sharing-selectors-with-props-across-multiple-components
export const makeGetArticleSelector = () => (
  createSelector(
    [getArticle],
    (article) =>
      article
  )
);
```