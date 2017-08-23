import config from 'config';
import { setEnvironmentConfig } from '../../common/actions/configActions';

export default store => {
  // hack to get serialized config from config module. see https://github.com/lorenwest/node-config/issues/223
  const environmentConfig = JSON.parse(JSON.stringify(config));
  store.dispatch(setEnvironmentConfig(environmentConfig));
};
