We created a set of utilities called 'wizard' for creating a multi-step form, where each
step in the form has it's own route in react-router. The steps are completely separate
 enhanced-redux-form instances, but the wizard form will take care of navigation between the routes
 and aggregating the input values submitted at each step. To configure a wizard, follow the
 steps below.

#### 1. Create routes in react-router
There must be a route with a parent 'wizard' component (in the example below, it is OnlineRegistration),
and a child route for each form step. These child routes should contain the enhanced-redux-form instances
for each step.

```
<Route path={Pages.ONLINEREGISTRATION} component={OnlineRegistration} isWizardForm>
	<IndexRedirect to={Pages.MEDICALCHECK} />
	<Route path={Pages.MEDICALCHECK} component={MedicalCheck} wizardFormOrder={0} />
	<Route path={Pages.PERSONALDETAILS} component={PersonalDetail} wizardFormOrder={1} />
	<Route path={Pages.SUMMARY} component={Summary} wizardFormOrder={2} />
</Route>
```
_Please note: react-router is now in charge of which form step is rendered. The wizard util does not directly
control which step is visible. Rather, it updates the route which will in turn update the component._

Note the following special props on Route:
 * **isWizardForm** _(required)_ Indicates the parent wizard component
 * **wizardFormOrder** _(required on each step)_ The steps are sorted on the value of this prop. The lowest
 value will be the first step. Routes without the wizardFormOrder prop will not be included as a step.


#### 2. Wrap the wizard component in enhancedFormWizard()
The wizard component, in this example OnlineRegistration, should be wrapped in an enhancedWizardForm
call when exported like so:
```
export default enhancedFormWizard({
  name: 'onlineRegistration',
  onSubmit: (dispatch, values) => { ... },
})(OnlineRegistration);
```
The _name_ should be unique to this wizard. For more information on the config values, see the api
docs for {@link module:enhanced-redux-form/enhancedFormWizard~enhancedFormWizard|enhancedFormWizard}.

#### 3. Add `{ destroyOnUnmount: false }` to all form steps
Because we want to preserve form step state while in the wizard, the destroyOnUnmount option of
enhanced-redux-form should be disabled.
```
export default enhancedReduxForm({
  form: 'medicalCheck',
  // add this config option:
  destroyOnUnmount: false,
}, medicalCheckValidation)(MedicalCheck);
```
Please note the following differences with the {@link http://redux-form.com/6.4.1/docs/api/ReduxForm.md/|redux-form documentation}:
 * Unlike what is recommended in the _Wizard Form_ section of redux-form, our form steps **should not
 share the same form name**.
 * Normally when adding `{ destroyOnUnmount: false }` to redux-form, you are responsible for manually
 calling the `destruct()` action on the form. In enhancedFormWizard, this will automatically be done
 on wizard destroy.

The enhancedFormWizard() function also has a `destroyOnUnmount` option with equivalent behavior. However,
 this option is **not required**. See {@link module:enhanced-redux-form/enhancedFormWizard~enhancedFormWizard|enhancedFormWizard}

### Flow
 * On mount, the wizard will redirect to the first step that has not yet been submitted.
 * Whenever a step form is submitted, the validation and onSubmit handler of that form will be called first.
 * When validation and onSubmit run without errors, the wizard will navigate to the next step.
 * If there is no next step, the _onSubmit_ handler of the wizard form will be called with the
 combined values of all form steps.