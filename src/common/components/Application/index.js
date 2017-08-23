import { connect } from 'react-redux';
import { compose } from 'redux';
import Application from './Application';

const mapStateToProps = state => ({
  hasGeneralError: state.error && !!state.error.length,
});

const connected = connect(mapStateToProps);

export default compose(connected)(Application);
