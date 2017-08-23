import { connect } from 'react-redux';
import ScrollManager from './ScrollManager';
import { clearScrollTo } from '../../actions/scrollActions';

export default connect(
  state => ({
    scrollTo: state.view.components.scrollManager.scrollTo,
    fixedHeaderElements: state.view.components.scrollManager.fixedHeaderElements,
  }),
  {
    clearScrollTo,
  },
)(ScrollManager);
