import { Component } from 'react';
import PropTypes from 'prop-types';

import { DeviceState, mediaQueries, reverseDeviceStateOrder } from '../../data/MediaQueries';

/**
 * Render this component once (preferable as high up your tree as possible).
 *
 * Use the withDeviceState HoC to provide the deviceState to your
 * components.
 *
 * Note: Usage of context is deprecated and will be removed in a future version!
 *
 * @example
 *
 * render() {
 *   return (
 *     <DeviceStateProvider>
 *       <Application />
 *     </DeviceStateProvider>
 *   );
 * }
 */
class DeviceStateProvider extends Component {
  constructor(props) {
    super(props);

    this.deviceStateNames = [];
    this.queryLists = [];
    this.queryListMatches = [];
  }

  getChildContext() {
    const { state, name } = this.props;

    return {
      deviceState: state,
      deviceStateName: name,
    };
  }

  componentDidMount() {
    this.initTracking();
  }

  componentWillUnmount() {
    this.queryLists.forEach(query => {
      if (query.removeListener) {
        query.removeListener(this.handleQueryChange);
      }
    });
    this.queryLists.length = 0;
  }

  initTracking() {
    this.deviceStateNames = Object.keys(DeviceState).filter(key => isNaN(parseInt(key, 10)));

    if (this.deviceStateNames.length) {
      this.queryLists = this.deviceStateNames.map(stateName => {
        const mediaQuery = mediaQueries[stateName];
        if (!mediaQuery) {
          throw new Error(`DeviceState ${stateName} not found in the mediaQueries array.`);
        }
        return window.matchMedia(mediaQuery);
      });

      if (this.queryLists[0].addListener) {
        this.queryLists.forEach(mql => {
          this.queryListMatches.push(mql.matches);
          mql.addListener(this.handleQueryChange);
        });

        this.updateFromMatchMedia();
      }
    }
  }

  handleQueryChange = changedMql => {
    this.queryLists.forEach((mql, index) => {
      if (mql.media === changedMql.media) {
        this.queryListMatches[index] = changedMql.matches;
      }
    });
    this.updateFromMatchMedia();
  };

  updateFromMatchMedia() {
    const numQueries = this.queryListMatches.length;

    for (let i = 0; i < numQueries; i++) {
      const index = reverseDeviceStateOrder ? i : numQueries - 1 - i;
      if (this.queryListMatches[index]) {
        if (this.props.state !== index) {
          this.props.setDeviceState(index, this.deviceStateNames[index]);
        }
        break;
      }
    }
  }

  render() {
    return this.props.children;
  }
}

/*
 * Deprecated
 */
DeviceStateProvider.childContextTypes = {
  deviceState: PropTypes.number,
  deviceStateName: PropTypes.string,
};

DeviceStateProvider.defaultProps = {
  children: null,
  state: 0,
  name: '',
};

DeviceStateProvider.propTypes = {
  children: PropTypes.node,
  state: PropTypes.number,
  name: PropTypes.string,
  setDeviceState: PropTypes.func.isRequired,
};

export default DeviceStateProvider;
