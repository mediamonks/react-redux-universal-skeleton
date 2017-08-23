```
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

// import the component you wish to connect
import Example from './Example'

/*
 * SIMPLE CONNECT
 */

// a function that receives the state, and returns props passed to the component
const mapStateToProps = (state) => ({
  foo: state.foo,
  bar: state.bar,
});

// an object with actionCreators that are called and dispatched when the prop is
// called from within the component
const mapDispatchToProps = {
  // fooAction,
  // barAction,
};

// mapStateToProps and mapDispatchToProps are defined separately (instead of in-line)
// so it's more clear what they do; the functions can become quite large.
// mapStateToProps can be passed as null, and mapDispatchToProps can be left out
const connected = connect(
  mapStateToProps,
  mapDispatchToProps,
);

// the ConnectedExample can define its own propTypes here, that are available as
// the second parameter (ownProps) in the mapStateToProps function.

export default compose(
  connected,
)(Example);


/*
 * CONNECT WITH SELECTORS
 */

// normally these are imports
// they are functions that return a new selector
let makeGetArticles;
let makeGetSearch;
let makeGetThemes;

const mapStateToProps2 = () => {
  // instead of returning a function immediately
  // this function is called a single time when this component is created
  // this is to make sure each component has their own selector that can
  // correctly memoize the selector parameter. If they were shared, they
  // would override each others values.
  const getArticles = makeGetArticles();
  const getSearch = makeGetSearch();
  const getThemes = makeGetThemes();

  // return the normal implementation, that makes use of the above
  // created selectors
  return (state) => {
    const isSearch = state.mode === 'search';

    return {
      themes: getThemes(state),
      articles: isSearch ? getSearch(state) : getArticles(state),
      deviceState: state.deviceState.state,
    };
  };
};

export const connected2 = connect(
  mapStateToProps2,
);
  
export const example2 = compose(
  connected2,
)(Example);
```
