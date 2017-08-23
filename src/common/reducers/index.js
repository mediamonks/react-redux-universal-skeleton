import combineReducersNamed from 'src/common/util/reducers/combineReducersNamed';

import defaultReducers from './defaultReducers';

import view from './viewReducer';

const appReducer = combineReducersNamed({
  ...defaultReducers,
  view,
})('');

export default appReducer;
