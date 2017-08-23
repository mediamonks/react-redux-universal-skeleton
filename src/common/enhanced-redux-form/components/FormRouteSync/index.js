import { connect } from 'react-redux';
import { compose } from 'redux';
import { formValueSelector } from 'redux-form';
import injectFormNameToProps from '../../utils/injectFormNameToProps';
import { syncValuesToRoute } from '../../actions/formRouteSyncActions';
import FormRouteSync from './FormRouteSync';

const connector = connect(
  (initialState, initialOwnProps) => {
    let currentForm = initialOwnProps.form;
    let currentFormSelector = formValueSelector(currentForm);

    return (state, ownProps) => {
      if (ownProps.form !== currentForm) {
        currentForm = ownProps.form;
        currentFormSelector = formValueSelector(currentForm);
      }

      const result = currentFormSelector(state, ...(ownProps.fields || []));
      return {
        values:
          ownProps.fields.length === 1
            ? {
                [ownProps.fields[0]]: result,
              }
            : result,
      };
    };
  },
  { syncValuesToRoute },
);

const wrapped = compose(injectFormNameToProps, connector)(FormRouteSync);

export default wrapped;
