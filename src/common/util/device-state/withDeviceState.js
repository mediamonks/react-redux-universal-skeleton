import { connect } from 'react-redux';

/**
 * @function withDeviceState
 *
 * A HoC for passing the deviceState to your component via the props.
 * Makes use of react-redux connect() HoC
 *
 * @returns {function} A function to compose or pass your component to
 *
 * @example
 *
 * import React, { PropTypes } from 'react';
 * import withDeviceState from 'src/common/util/device-state/withDeviceState';
 * import { DeviceState } from 'src/common/data/MediaQueries';
 *
 * const CreatePost = ({
 *   otherPropFromComponent,
 *   deviceState,
 *   deviceStateName,
 * }, { getMessage }) => (
 *   <div>
 *     { deviceState > DeviceState.LG ?
 *       <span>{foo}</span>
 *     : null }
 *   </div>
 * );
 *
 * CreatePost.propTypes = {
 *   otherPropFromComponent: PropTypes.number,
 *   deviceState: PropTypes.number,
 *   deviceStateName: PropTypes.string,
 * };
 *
 * export default withDeviceState()(CreatePost);
 *
 */
export default () => WrappedComponent =>
  connect(({ deviceState }) => ({
    deviceState: deviceState.state,
    deviceStateName: deviceState.name,
  }))(WrappedComponent);
