import { connect } from 'react-redux';
import { compose } from 'redux';

import GeneralError from './GeneralError';

const mapStateToProps = state => ({
  error: state.error && state.error[0],
});
const connected = connect(mapStateToProps);

export default compose(connected)(GeneralError);
