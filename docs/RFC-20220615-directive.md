# Directive

## Design considerations

- Prefix vs Suffix
  - Parser efficiency
  - Visual noise
  - Visual alignment
  - Cursor momentum direction

## Features

@ref() for internal link tracking
@id() passively generated when being referenced (helps preserve node identity)
@url() for external link
@feed() for rss generator
@tags() for arbitrary tagging
@todo/@done for todo tracking
@date() for calendar tracking

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
