# Tri-state version control

[Continued from](./RFC-20230529-single-db-architecture.md)

- Tracking is based on local peer's world view
- Each document has three states:
  - `local`: local peer has seen the document
  - `remote`: remote peer has seen the document
  - `base`: local and remote peers have seen the document

## DB consistency mechanism

### States v1

Consistent states. ? means nullable content

| local | remote | base | remarks        | editor |
| ----- | ------ | ---- | -------------- | ------ |
| l     |        |      | new            | l      |
|       |        | b    | unchanged      | b      |
| l?    |        | b    | dirty (l >= b) | l      |

Time based transient state should be resolved with DB triggers

| local | remote | base | remarks                   | new local | new remote | new base |
| ----- | ------ | ---- | ------------------------- | --------- | ---------- | -------- |
| l?    | r?     | b    | conflict (l >= r)         |           |            | l?       |
| l?    | r?     | b    | conflict (l < r)          |           |            | r?       |
|       | r      |      | fetched new               |           |            | r        |
|       | r?     | b    | fetched existing (r >= b) |           |            | r?       |

Content based transient state should be resolved after time based transient state

| local | remote | base | remarks                 | new local  | new remote | new base   |
| ----- | ------ | ---- | ----------------------- | ---------- | ---------- | ---------- |
| null  |        |      | discard new             | delete row | delete row | delete row |
|       |        | null | remote deleted          | delete row | delete row | delete row |
| x     |        | x    | same change (x != null) |            |            | x          |
| null  |        | null | both deleted            | delete row | delete row | delete row |

### States v2

Consistent states. ? means nullable content

| local | remote | base | remarks           | editor v2  |
| ----- | ------ | ---- | ----------------- | ---------- |
| l     |        |      | new               | l          |
|       |        | b    | unchanged         | b          |
| l?    |        | b    | dirty (l >= b)    | l          |
| l?    | r?     | b    | conflict (l >= r) | l-b vs r-b |
| l?    | r?     | b    | conflict (l < r)  | l-b vs r-b |

Time based transient state should be resolved with DB triggers

| local | remote | base | remarks                   | new local | new remote | new base |
| ----- | ------ | ---- | ------------------------- | --------- | ---------- | -------- |
|       | r      |      | fetched new               |           |            | r        |
|       | r?     | b    | fetched existing (r >= b) |           |            | r?       |

Content based transient state should be resolved after time based transient state

| local | remote | base | remarks                 | new local  | new remote | new base   |
| ----- | ------ | ---- | ----------------------- | ---------- | ---------- | ---------- |
| null  |        |      | discard new             | delete row | delete row | delete row |
|       |        | null | remote deleted          | delete row | delete row | delete row |
| b     |        | b    | same change (b != null) |            |            | b          |
| null  |        | null | both deleted            | delete row | delete row | delete row |
| x     | x      | b    | same change (x != null) |            |            | b          |
| null  | null   | b    | both deleted            | delete row | delete row | delete row |

## Lifecycle

### Create and push

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        |      |
| create | t0    |        |      |
| edit   | t1    |        |      |
| push   |       |        | t2   |

### Edit and push

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        | t0   |
| edit   | t1    |        | t0   |
| push   |       |        | t2   |

### Edit and revert

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        | t0   |
| edit   | t1    |        | t0   |
| revert |       |        | t0   |

### Pull/Clone new item

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        |      |
| fetch  |       | t0     |      |
| merge  |       |        | t0   |

### Pull existing item

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        | t0   |
| fetch  |       | t1     | t0   |
| merge  |       |        | t1   |

### Edit, fetch, auto-adopt remote

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        | t0   |
| edit   | t1    |        | t0   |
| fetch  | t1    | t2     | t0   |
| merge  |       |        | t2   |

### Edit, fetch, auto-adopt local

| action | local | remote | base |
| ------ | ----- | ------ | ---- |
| init   |       |        | t0   |
| edit   | t2    |        | t0   |
| fetch  | t2    | t1     | t0   |
| merge  | t2    |        | t1   |
