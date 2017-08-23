import { setRenderMode } from '../../common/actions/renderActions';
import RenderMode from '../../common/data/enum/RenderMode';

export default (store, req) => {
  const renderMode = (req.cookies && req.cookies.rendermode) || RenderMode.SERVER;
  store.dispatch(setRenderMode(renderMode));
};
