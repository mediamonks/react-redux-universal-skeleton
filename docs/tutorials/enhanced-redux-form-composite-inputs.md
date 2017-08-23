Some fields in our forms consist of multiple inputs that should group to a single value. For example,
a date field that consists of a day, month and year inputs.

### The redux-form solution
The redux-form library has a component called {@link http://redux-form.com/6.4.0/docs/api/FormSection.md/|FormSection}
that groups multiple inputs into one section. This solves part of our problem: it groups the inputs
under a common name. For example, `year`, `month` and `day` fields in a `FieldSection` named `dayOfBirth`
will dynamically be renamed to `dayOfBirth.year`, `dayOfBirth.month` and `dayOfBirth.day`. However,
it does not combine these values into a single value for form validation and submission. They are
still completely separate inputs. The `CompositeInput` component is build around `FormSection`
to provide this functionality.

### The enhanced-redux-form CompositeInput component
The example below uses the `CompositeInput` component to group 2 separate fields (`feet` and `inches`)
into a single field called `height`.

```
<CompositeInput name="height" formatter={compositeInputFormatters.FEET_INCHES}>
    <EnhancedField component={Input} type="number" step="1" placeholder="feet" name="feet" />
    <EnhancedField component={Input} type="number" step="1" placeholder="inches" name="inches" />
</CompositeInput>
```

To `redux-form`, the `feet` and `inches` inputs are still separate fields. These fields will be
combined into a single value by `enhanced-redux-form` before running validation and passing the values
to the `onSubmit` handler. These values are combined by the `FEET_INCHES` formatter defined inside
`compositeInputFormatters.js`. All formatter functions need to be defined in this module in order
for `enhanced-redux-form` to find them. Below is an example of what this formatter might look like:

```
// compositeInputFormatters.js
const formatters = {
   ...
   FEET_INCHES: ({feet, inches}) => {
     const feet = parseInt(feet, 10);
     const inches = parseInt(inches, 10);

     return feet + (inches / 12);
   }
   ...
}
```

### Throwing validation errors in formatters
In our validation config (see {@tutorial enhanced-redux-form-validation}) we can now validate
our `height` value in inches. However, what if the values for `feet` or `inches` are invalid before
 they reach the formatter? In this case, we can use the special error type `CompositeInputFormatterError`
 to trigger a validation error back to the user, and mark the `height` field as invalid. Below is
 the `FEET_INCHES` formatter with additional validation checks on the individual values.

```
// compositeInputFormatters.js
const formatters = {
   ...
   FEET_INCHES: ({feet, inches}) => {
     const feet = parseInt(feet, 10);
     const inches = parseInt(inches, 10);

     if (isNaN(feet)) {
        // triggers a validation error on the 'feet' input
        throw new CompositeInputFormatterError({ feet: 'Feet should be a number' });
     }
     if (isNaN(inches)) {
        // triggers a validation error on the 'inches' input
        throw new CompositeInputFormatterError({ inches: 'Inches should be a number' });
     }
     if (inches >= 12) {
        // triggers a validation error on the 'inches' input
        throw new CompositeInputFormatterError({ inches: 'Inches should be smaller than 12' });
     }

     const result = feet + (inches / 12);
     if (result < 0) {
        // triggers a general validation error on the CompositeInput
        throw new CompositeInputFormatterError('This value cannot be negative!');
     }

     return result;
   }
   ...
}
```