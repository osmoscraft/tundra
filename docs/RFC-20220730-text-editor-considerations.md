# Text Editor

## Goal

- Programmatic + human editing
  - Need to programmatically append, rename, reorder, remove items without mounting the DOM
  - Need to maintain Git change consistency across programmtic and human edits
  - Need to undo/redo
- Structured editing
  - Block movement
  - Block selection
  - Block copy/pasting
  - Block type conversion
  - Block split/swap
- Unstructured editing
  - Partial selection/delete/backspace
  - Partial copy/pasting
- List as first class block
  - Visually free-from indent/outdent/move up/move down
  - Semantically conform to markdown list syntax
- Markdown as source of truth
- Leverage browser built-in behavior
- Support CJK input

## Editor lifecycle

This is superceded by [Editor Architecture](./RFC-20220827-text-editor-architecture.md);

1. Read primary node and blacklink md files from disk
2. Linearize: flatten all nodes into a single md file, the output is the "model" for the editor
3. Render the "model" into html "view"
4. Mount the html "view" to DOM
5. User starts editing
6. During edit, view receives user input, and self-heal without touching "model"
   1. Inline edit, no-op
   2. Inter-block edit: Enter/Backspace/Delete/Paste/Cut/Drop
      1. Remove illegal HTML constructs in "view"
      2. Align spacing to visual grid
7. On serialization: flush "view" back to "model"
   1. Normalize for markdown rules
8. Atomize: split the model into muleiple md source files
9. For each source file, flush the changes to disk

## How to detect inter-block edit?

- Before edit
  - Inspect clipboard content for inter-block elements
- After edit
  - Mutation observer

## Markdown format

- See: [Transclusive editor](./RFC-20220703-transclusive-editor.md)

## HTML format

- Should allow easy block manipulation
- Cannot introduce metadata that cannot be represented in plaintext markdown
- Should allow for future extensibility
  - Linked/Backlinked/Borrowed node

## Literature review

### TinyMCE 6

- No open source design documentation

### ProseMirror

- Content model
  - Text segments + metadata annotations
  - One to one mapping between the model and the visible
- Duo encoding
  - Tree model (spatial)
  - Flat token list model (sequential)
- Mapping
  - Schema includes pure function that provides dom representation
- Edits
  - Each edit is a transform
  - Transform produces steps
  - Each step either replace content or add mark (metadata) to content range
  - "Map" is used to compenstation for position shift after edits
- Architecture
  - Editor state
    - Doc: content model
    - Selection
    - Stored mark (e.g. enabled a style but there is no content yet)
  - View
    - Display editor state
    - Collect user input
    - DOM events are first processed by browser, then by editor
    - Build-in diffing for efficient update
    - Undo is still handled by the editor, not by browser

### Medium

- url: https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480
- Bare ContentEditable fails WYSIWYG axioms
  - DOM content to visible content is many to one
  - DOM selection to visible selection is many to many
  - Visible edits to visible content is many to many
- Suggestions:
  - Model the content
  - Two way map for DOM and content
  - Define the operations on model
  - Translate raw input into operations
