# Plugins

Just an idea on how multiple content type + encoding can be supported

## Body Plugin

```typescript
type MaybePromise<T> = T | PromiseLike<T>;

interface Plugin {
  mime: RegExp | string | string[]; // The content type that activates the parser
  getTitle: () => MaybePromise<string>;
  getText: () => MaybePromise<string>;
}
```

## Header plugin

```typescript
interface Plugin {
  mime?: RegExp | string | string[]; // omit the field to match all mime types
  onBodyChange: (change) => any;
}
```
