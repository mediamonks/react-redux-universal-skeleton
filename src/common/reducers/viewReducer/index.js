import combineReducersNamed from 'src/common/util/reducers/combineReducersNamed';

import defaultViewReducers from './defaultViewReducers';

export default combineReducersNamed({
  ...defaultViewReducers,
});
