import { connect } from 'react-redux';
import { compose } from 'redux';

import ApplicationError from './ApplicationError';

// eslint-disable-next-line no-unused-vars
const mapStateToProps = state => ({});

const connected = connect(mapStateToProps);

export default compose(connected)(ApplicationError);
