# Candidate Architecture - Model for diffing, truth in DOM

## Concept A - Model is truth

- What
  - Same as ProseMirror data flow
  - All DOM events lead to state update
  - Render State to DOM with custom diffing
- Pro
  - Most well-behaved
  - Most clean architecture
  - Easy undo/redo
- Con
  - Performance (similar to vDOM tradeoff)

## Implementation

- Markdown used as model
- Edits described as text diff, friendly for undo/redo
  - Potentially interoperable with Git diff, allow full history undo/redo
- Model process pipeline will operate in the plaintext space (no DOM access)
- Renderer will perform diffing
  - Reading textContent should be cheap
  - DOM update logic is deterministic and reusable

## Non-goals

- Metadata (i.e. Front matter) will not participate
- Multi-cursor will not be supported

## Reference interface

```typescript
interface EditorState {
  lines: string[];
  selection: EditorSelection;
}

interface EditorChangeStateBased {
  prevState: EditorState; // consider using immutable data type to improve perf
  newState: EditorState;
}

interface EditorChangeTransactionBased {
  sourceSelection: EditorSelection;
  newText?: string; // allow inline break
  newSelection?: EditorSelection;
}

interface EditorPosition {
  row: number;
  col: number;
}

interface EditorSelection {
  anchor: EditorPosition;
  focus: EditorPosition;
}
```

## Reference implementaton I - Relaxed data flow

```typescript
const dom = document.getElementById("root");
const state = new EditorState(initialMarkdown);
const view = new EditorView(dom, state);

dom.addEventListener("WILL_CHANGE", (e) => {
  // cancel, transform, intercept, augment
  // dispatch
  editor.dispatch("TRANSACTION");
});

dom.addEventListener("DID_CHANGE", (e) => {
  // validate, and dispatch patch transactions

  editor.historyPush();
  editor.dispatch("TRANSACTION");
});

editor.addEventListener("COMMANDS", (e) => {
  process(e);
  editor.dispatch("TRANSACTION");

  // in case of undo/redo
  editor.historyUndo();
  editor.historyRedo();
});

editor.addEventListener("TRANSACTION", (e) => {
  applyToDom(e);
  // this could trigger more dom events
});
```

## Reference implementation II - Strict data flow

```typescript
const dom = document.getElementById("root");
const state = new EditorState(initialMarkdown);
const view = new EditorView(dom, state);

render(dom, state);
dom.addEventListener("*", (e) => {
  const changes = processEvent(e);
  state.patch(changes);
  render(dom, state);
});

function render(dom, state) {
  const needPatch = diff(dom, state);
  if (needPatch) {
    // dom imperative updates
    // selection imperative updates
  }
}
```

# Appendix

## Alternative architectures

### Model for diffing, truth in DOM

- What
  - A parital model that stores what could be changed at any given moment (given selection state)
  - Pre and Post-change DOM events will be processed together with partial model to get the transformations
  - Transformations will be applied to DOM, using partial model for diffing
  - Parital model auto updates as selection and curosr changes
- Pro
  - Well-behaved
  - Reduced Memory use
  - Good performance
- Con
  - Challenging undo/redo
  - Complexity in updating partial model

### Concept C - Model-free, truth in DOM

- What
  - Pre and post-change DOM events will trigger handlers for processing
  - All states are fully captured in DOM.
- Pro
  - Least memory use
  - Best performance
- Con
  - Not well-behaved
  - May limit capabilities due to lack of state memory
  - Undo/redo may not be possible, or additional state must be introduced
  - Most difficult to reason about due to async event pipelines, potential race condition
