import environmentConfigHook from './environmentConfigHook';
import renderModeHook from './renderModeHook';

export default (store, req) => {
  environmentConfigHook(store, req);
  renderModeHook(store, req);
};
