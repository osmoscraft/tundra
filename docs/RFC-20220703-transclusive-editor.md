# Transclusion Architecture

Goals

- Efficiently edit structured transcluded blocks in a familiar linear model
- Quickly enrich foreign objects without leaving the current context
- Injects current context into the foreign object

## Note types

- Primary node
  - One and only one per file
  - Must be at depth 0
  - The ontogological content
  - Children belongs to the Primary node and only appears within Primary node context
  - May contain related nodes
- Related node
  - Zero or more per file
  - Must be at depth 1+
  - Other related nodes
  - Children belows to the Primary node, and appears in both Primary node and related nodes
- Foreign nodes
  - Must be at depth 0, after Primary node
  - Same as Primary node, but content belows to their orign Primary nodes

## In storage

- Each file stores a single root node, which is the primary node
- The root node should maintain a link to itself
- Reference style markdown link is discouraged due to copy/paste portability

File: 001.md

```md
- [Foo](001)
  - [https://example.com](https://example.com)
  - Item 2
  - Item 3
  - [Bar](002)
  - [Baz](003)
    - Because of [https://example.com](https://example.com)
  - [Lorem](004) and [Ipsum](005)
    - Resolve both by [Bar](002)
```

File: 002.md

```md
- [Bar](002)
  - Item a
  - Item b
```

File: 003.md

```md
- [Baz][003]
  - Item I
  - Item II
```

## In editor

- Link references are automatically managed
  - Auto-sorting
  - Auto-deduplication
- Multiple top-level nodes are allowed
  - Only the first top-level node is persisted
  - Other top-level nodes are "borrowed" into the current scope for editing
  - Edits are saved into those nodes respecitvely
- Raw URLs do not need to be linked manually

```
- [Foo](001)
  - https://example.com
  - Item 2
  - Item 3
  - [Bar](002)
  - [Baz](003)
    - Because of https://example.com
  - [Lorem](004) and [Ipsum](005)
    - Resolve both by [Bar](002)
- [Lorem][004]
  - Guest edits made here
- [Ipsum][005]
  - More guest edits mode here
```
