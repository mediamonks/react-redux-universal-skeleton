import { connect } from 'react-redux';
import { compose } from 'redux';

import { setDeviceState } from '../../actions/deviceStateActions';
import DeviceStateProvider from './DeviceStateProvider';

const mapStateToProps = state => state.deviceState;

const mapDispatchToProps = {
  setDeviceState,
};

const connected = connect(mapStateToProps, mapDispatchToProps);

export default compose(connected)(DeviceStateProvider);
