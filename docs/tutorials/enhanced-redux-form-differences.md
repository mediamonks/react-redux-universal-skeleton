For general usage of redux-form, please refer to the {@link http://redux-form.com/|redux-form website}.
Below is outlined how usage of enhanced-redux-form differs from what is described in the documentation
provided by redux-form.

### Use enhancedReduxForm() instead of reduxForm()
See enhancedReduxForm.js for API documentation of the validationConfig object
```javascript
// redux-form syntax:
reduxForm({
  form: 'formName',
  ...
})(MyForm);

// new syntax
enhancedReduxForm({
  form: 'formName',
  ...
}, validationConfig)(MyForm);
```

### Validation is _not_ managed in redux-form
Because the validation functionality in redux-form is very limited, we manage validation and passing
errors to components in enhanced-redux-form. Please refer to {@tutorial enhanced-redux-form-validation}

### Use &lt;EnhancedField&gt; instead of &lt;Field&gt;
Our {@link EnhancedField} component injects our custom
validation results into the field. The syntax is exactly the same as the redux-form <Field> component:
```jsx
// redux-form syntax
<Field name="myField" component={Input} />
// new syntax
<EnhancedField name="myField" component={Input} />
```

### Use onSubmit to add a form submit handler
redux-form allows 2 different methods of adding a form submit handler. Because enhancedReduxForm
has custom submit logic to handle validation and composite inputs, only the 'onSubmit' method is supported.
```jsx
// onSubmit as prop, is supported
const MyReduxForm = enhancedReduxForm({ form: 'formName' }, validationConfig)(MyForm);
...
<MyReduxForm onSubmit={mySubmitHandler} />

// onSubmit as enhancedReduxForm configuration, is supported
const MyReduxForm = enhancedReduxForm({
  form: 'formName',
  onSubmit: mySubmitHandler,
}, validationConfig)(MyForm);

// submit passed inside render method, NOT supported
class MyForm extends Component {
  ...
  render() {
    const { handleSubmit } = this.props;
    return (
      <form onSubmit={handleSubmit(this.mySubmitHandler)>
        ...
      </form>
    );
  }
}
```

### onSubmitFail and onSubmitSuccess handlers are not called
These handlers are not yet supported in our custom submission logic. If needed they can still be implemented.