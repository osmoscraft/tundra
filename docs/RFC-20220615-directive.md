# Directive

## Design considerations

- Prefix vs Suffix
  - Parser efficiency
  - Visual noise
  - Visual alignment
  - Cursor momentum direction
- Inline vs. nested
  - Handle multiple directives per node
- Interoperate with [list](./RFC-20220615-list.md)
- Single line vs. Multiline target

## Features

@inbox for default host of new nodes
@ref() for internal link tracking
@id() passively generated when being referenced (helps preserve node identity)
@url() for external link
@feed() for rss generator
@tags() for arbitrary tagging
@todo/@done for todo tracking
@date() for calendar tracking
@lang() for programming languages
@block() for extensible blocks

## Ideas

Suffix

```
- LOTR
  - By: J.R.R. Tolkien @ref(ks983h2d89)
- J.R.R Tolkien @id(ks983h2d89)
  - English writer, poet

```

Leader

```
- LORT
  - By
	  - @ref(ks983h2d89) J.R.R Tolkien
- J.R.R Tolkien
  - @id(ks983h2d89)
	- Ensligh writer, poet
```
