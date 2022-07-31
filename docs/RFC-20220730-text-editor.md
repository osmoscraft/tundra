# Text Editor

## Goal

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

1. Convert markdown source to HTML string (discard frontmatter)
2. Render HTML to DOM
3. Mount editor to DOM, editor takes over DOM management
   1. Inline edit, no-op
   2. Inter-block edit: Enter/Backspace/Delete/Paste/Cut/Drop
      1. Remove illegal HTML constructs
      2. Align spacing to visual grid
   3. On serialization: Save or on-demand formating:
      1. Normalize for markdown rules
4. Unmount editor from DOM
5. Remount to new DOM
6. Get inner HTML from DOM
7. Get Markdown from HTML

## How to detect inter-block edit?

- Before edit
  - Inspect clipboard content for inter-block elements
- After edit
  - Mutation observer
