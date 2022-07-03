# Recursive Blocks

Goals

- Represent blocks that can be recursively nested, in markdown format
- Flexible for "zooming" in/out

## In storage

File: 0001

```md
# Foo

- Item 1
- Item 2
- Item 3
- [id:0002]
- [id:0003]

[id:0002]: /card/0002.md
[id:0003]: /card/0002.md
```

File: 0002

```md
# Bar

- Item a
- Item b
```

File: 0003

```md
# Baz

- Item I
- Item II
```

## In editor

Treat all level 1 headings as root of block

```
# Foo
- Item 1
- Item 2
- Item 3
┌──────────┐
│ # Bar    │
│ - Item a │
│ - Item b │
└──────────┘
┌───────────┐
│ # Baz     │
│ - Item I  │
│ - Item II │
└───────────┘
```

Alternatively, in editor avoid heading in general

```
- [Foo][id:0000]
  - Item 1
  - Item 2
  - Item 3
  - [Bar][id:0001]
    - Item a
    - Item b
  - [Baz][id:0002]
    - Item I
    - Item II
```

In storage: just store one list per file, with depth = 1

```
- [Foo][id:000]
  - Item 1
  - Item 2
  - Item 3
  - [Bar][id:001]
  - [Baz][id:002]
```

If an item contains a single block link, transclusion is ON, if it contains multiple, transclusion is OFF

```
- [Foo][id:000]
  - [Item 1][id:001]
    - This item belongs to id:001
  - See also: [Item 2][id: 002]
    - This item belongs to id:002
  - Compare: [Item 3][id: 003] and [Item 4][id: 004]
    - This item belongs to id:000
```
