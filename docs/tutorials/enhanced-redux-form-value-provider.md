Sometimes we want to use the current value of an input in a form. For example, we want to hide or
show an input based on the value of another input. The FormValueProvider is a util component
that implements this in a way that performs well. We should always use this component to prevent
the performance bottlenecks that can occur when using connect().

Example:
```
const FemaleOnlySection = ({ formValues: { gender } }) => {
	if (gender === 'female') {
		return (
			<div>
			    // these inputs only appear when gender === 'female'
			    ...
			</div>
		);
	}
	return <div />
}

<FormValueProvider fields={['gender']}>
    <FemaleOnlySection />
</FormValueProvider>
```

See {@link FormValueProvider} for detailed documentation