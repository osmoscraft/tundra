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
- Linked node
  - Zero or more per file
  - Must be at depth 1+
  - Other related nodes
  - Children belows to the Primary node, and appears in both Primary node and related nodes
- Backlinked nodes
  - The primary node of any linked nodes becomes a backlinked node in the editor for those linked nodes
  - Must be at depth 0, after Primary node
- Borrowed nodes
  - Temporarily displayed for referencing or editing
  - Do not persist
  - If the current primary node is added into a borrowed node, the borrowed node becomes a backlinked node

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

- Multiple top-level nodes are allowed
  - Only he first top-level node is persisted in the current file
  - Other top-level nodes are either "backlinks" or "borrowed"
  - Edits are saved into those nodes respecitvely
- Raw URLs do not need to be linked manually

```md
- [Foo](001)
  - https://example.com
  - Item 2
  - Item 3
  - [Bar](002)
  - [Baz](003)
    - Because of https://example.com
  - [Lorem](004) and [Ipsum](005)
    - Resolve both by [Bar](002)
- [Lorem](004)
  - Lorem is great
- [Ipsum](005)
  - More guest edits mode here
```

When viewed from foreign node

```md
- [Lorem](004)
  - Lorem is great
- [Foo](001)
  - [Lorem](004) and [Ipsum](005)
    - Resolve both by [Bar](002)
```

## Case study: Add incoming link via a borrowed node

Start, Foo view

```md
- [Foo](001)
```

Start, Bar view

```md
- [Bar](002)
```

Foo borrows Bar

```md
- [Foo](001)
- [Bar](002)
```

Foo adds backlink from Bar

```md
- [Foo](001)
- [Bar](002)
  - Affects [Foo](001)
```

Now view from Bar, Foo becomes a forward link

```md
- [Bar](002)
  - Affects [Foo](001)
```

### Case study: Inject context into a linked node

Start, Foo view

```md
- [Foo](001)
```

Foo injects context into Bar

```md
- [Foo](001)
  - Affects [Bar](002)
    - Makes it stronger
    - Makes it faster
```

Now view from Bar, Foo becomes a backlink

```md
- [Bar](002)
- [Foo](001)
  - Affects [Bar](002)
    - Makes it stronger
    - Makes it faster
```
