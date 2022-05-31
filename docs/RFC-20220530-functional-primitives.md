# Problem

JavaScript isn't the most ergonomic language for functional programming:

- try...catch... creates closures that requires the use of `let` and assignment.
- Function wrappers increases nest level, thus degrading readability

# Solutions

```javascript
const decoratedFn = f(myFunction).wrap(
  withPerfTimer((duration) => console.log(duration)),
  withErrorCoercing((error) => null),
  asContentScript()
);
const result = decoratedFn();

const decoratedValue = v(myValue).pipe(emptyStringAs(null), logInStatusBar());

// combine the two
f(myFunction).wrap(
  withRetry(3),
  withErrorCoercing((error) => error),
  withResultPipe(errorAs(undefined))
);

// alterantively, use fn for value too
const decoratedValue = f(() => myValue).wrap(returnStringAs(null))(); // notice the immediate invocation
```

Considerations: TypeScript interface implementation for operators that changes the output signature
