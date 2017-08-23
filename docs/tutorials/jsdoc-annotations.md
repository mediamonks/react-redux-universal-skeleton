For rendering this API documentation, we use the standard jsdoc module. You can find general
documentation on how to write jsdoc comments on {@link http://usejsdoc.org/|their website}. However,
there are a few things to look out for to make sure the jsdoc is rendered correctly on this
documentation website.

#### Re-rendering documentation
Our docs are exported to /docs/output in the frontend repository. If you have written new
documentation and want it to be included in the repository, you need to execute the render
command and commit the changes to git:
```
npm run docs
```

#### The @module annotation
If you have multiple jsdoc definitions in one file (for example, the file exports multiple functions),
it is best to group the definitions using an @module annotation. Just add this to the top of
your source:
```javascript
/** @module some-module-name */
```
If a source file only exports a single class, __leave out__ the @module annotation to prevent
 cluttering the menu with modules that only contain a single class.

#### Usage @class, @method, @function
Most of the time it is not needed to annotate a class or function using these annotations. Jsdoc
can already detect functions and classes from their es2015 syntax. However, in some cases
it is neccessary to hint to the jsdoc parser. For example when using the arrow notation:
```javascript
/**
 * This function won't be parsed as a function if you don't add the @function annotation
 * @function square
 */
const square = x => (x * x);
```

There is one important consequence of using these annotation: it puts the functions in a
global scope. Consider the following example:
```
/**
 * This is an awesome class
 */
class MyClass {
  /**
   * this super neat method always returns 5
   */
  foo() {
    return 5;
  }
}
```
JSDoc will automatically detect that the method foo() is part of the class MyClass. However,
as soon as you add a @method annotation, this will no longer be the case.
```
/**
 * This is an awesome class
 */
class MyClass {
  /**
   * this super neat method always returns 5
   * @method foo
   */
  foo() {
    return 5;
  }
}
```
In the above example, foo() is no longer inside of MyClass. You will have to explicitly indicate
this using @memberof, like so:
```
/**
 * This is an awesome class
 */
class MyClass {
  /**
   * this super neat method always returns 5
   * @method foo
   * @memberof MyClass
   */
  foo() {
    return 5;
  }
}
```
