# Haiku Syntax

## Taxonomy

- Block
  - Link
  - Text/Title
  - Text/Details
  - List
  - Quote
  - Code
- Inline
  - Link
  - Code
  - Quote

## Relationship representation

Key-Value(s) relationship

```
- <Key>: <Value>
- <Key>: <Value1>, <Value2>, <Value3>
```

Master-detail relationship

```
- Master
  - Detail
```

Alternatively Master-detail (require contextual parser)

```
- Master
  Detail
```

Parent-child relationship

```
- Parent
  - Child1
  - Child2
  - Child3
```

Supplement-supplemented relationship

```
- [Referenced topic](...)
  - Supplemental information
```
