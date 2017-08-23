`enhanced-redux-form` includes improved validation functionality. Instead of having a single validate()
function for an entire form, each input can be validated individually.

### Configuration
The validation configuration can be passed as a second argument to the
{@link module:enhanced-redux-form~enhancedReduxForm|enhancedReduxForm} function. See an example
below.


```
const registrationValidation = {
  // the keys in this object correspond to the 'name' prop of the <EnhancedField> instances
  firstName: {
    validators: [
      {
        rule: required,
        message: 'A first name is required',
      },
      // this validation rule will only be executed when the above rule returns true
      {
        rule: value => (value.length > 3),
        message: 'Your first name should be longer than 3 characters',
      },
    ],
  },
  userName: {
    validators: [
      {
        // A rule can return a promise as well, if it needs to perform async validation
        // the promise should resolve with 'true' for valid or 'false' for invalid
        rule: (value, values, fieldName, dispatch) => dispatch(checkUsernameIsValid(value)),
        message: 'This username already exists',
      }
    ],
    // by default, we only run validation on form submit. you can modify this behavior like so:
    validateOn: [ ValidateOn.CHANGE ],
  }
};

export default enhancedReduxForm({
  form: 'registration',
  destroyOnUnmount: false,
}, registrationValidation)(RegistrationForm);
```

### Running validation
When an enhancedReduxForm instance is submitted, it will first run validation before calling the
submit handler. If any of the validators fail, the submit handler will not be executed. If you
want to perform validation more often, use the `validateOn` prop in the configuration.

