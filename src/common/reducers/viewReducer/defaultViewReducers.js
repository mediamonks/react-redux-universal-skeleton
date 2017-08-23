import components from './componentsReducer';

/**
 * Contains default reducers for all state that is visible to the end user. Some examples of
 * state that belongs in this reducer:
 *  - if the modal window is currently open, and what content is currently being shown inside
 *
 * Some examples of state that does not belong in this reducer:
 *  - the current state of a form. While this is technically 'view' state, this state is put
 *  into our 'form' and 'enhancedForm' reducers because it is handled by other libraries.
 * @type {object}
 */
const defaultViewReducers = {
  components,
};

export default defaultViewReducers;
