In order to bundle the content script and keep it compatible with `chrome.scripting` api, make sure each file uses the following format:

```typescript
export default function () {
  // implementation
}
```

See related setup in `build.mjs`
