import { Component } from 'react';
import { debounce } from 'throttle-debounce';
import PropTypes from 'prop-types';
import scrollTo from '../../util/scrollTo';

const SCROLL_TO_DEBOUNCE = 200;
const SCROLL_TO_DURATION = 500;

/**
 * Helper class that watches the redux state for points to scroll to. When new points
 * come in, it will scroll to the highest point and clear the points from the state.
 */
class ScrollManager extends Component {
  componentWillReceiveProps(newProps) {
    if (newProps.scrollTo !== this.props.scrollTo) {
      this.executeScrollDebounced();
    }
  }

  executeScroll = () => {
    if (this.props.scrollTo.length) {
      const topScrollTo = this.props.scrollTo.reduce(
        (top, current) => (current.position < top.position ? current : top),
        { position: Number.MAX_VALUE },
      );

      const documentScrollTop =
        (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
      const windowBottom = documentScrollTop + window.innerHeight;
      const { fixedHeaderElements } = this.props;
      const fixedNames = Object.keys(fixedHeaderElements);
      const fixedOffset = fixedNames.length
        ? Math.max(...fixedNames.map(name => fixedHeaderElements[name]))
        : 0;
      const finalScrollTo = topScrollTo.position - fixedOffset;

      // only scroll to if position is not already within viewport
      if (
        !topScrollTo.onlyScrollWhenNotInView ||
        finalScrollTo < documentScrollTop ||
        finalScrollTo > windowBottom
      ) {
        scrollTo(0, finalScrollTo, { duration: SCROLL_TO_DURATION });
      }

      this.props.clearScrollTo();
    }
  };

  executeScrollDebounced = debounce(SCROLL_TO_DEBOUNCE, false, this.executeScroll);

  render() {
    return null;
  }
}

ScrollManager.defaultProps = {
  fixedHeaderElements: {},
};

ScrollManager.propTypes = {
  scrollTo: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.number.required,
      onlyScrollWhenNotInView: PropTypes.bool,
    }),
  ).isRequired,
  clearScrollTo: PropTypes.func.isRequired,
  fixedHeaderElements: PropTypes.objectOf(PropTypes.number),
};

export default ScrollManager;
