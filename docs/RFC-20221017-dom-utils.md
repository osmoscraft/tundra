# DOM Utils

jQuery is replaced by platform standard APIs but it got a few design aspects right:

1. Chainablility
2. Monadic behavior on empty data
3. Polymorphic interface for both read and write (reduced cognitive load)

The goal is to produce a similar tool but with FP usage in mind. With additional traits desired:

1. Interoperability with symbol.iterable
2. Lazy evaluation for perf and runtime optimization (consider vdom)
3. Non-blocking and async behavior via iterator and generator
4. Interoperability with JSX? (h method as facade)

## Monadic design

```
Create :: * -> Selection
Selection ~> selective -> * -> Selection
Selection ~> mutative -> * -> Selection
Selection ~> write -> * -> string | Node
Selection ~> read -> * -> *


// Selective examples
Selection ~> children -> Selector -> Selection
Selection ~> closest -> Selector -> Selection
Selection ~> first -> () -> Selection
Selection ~> filter -> Selector -> Selection


// Mutative examples
Selection ~> attr -> (string, string) -> Seletion
Selection ~> class -> [string] -> Seletion
Selection ~> append -> Selection -> Selection
Selection ~> remove -> Selection -> Selection


// Low level
Selection ~> map -> Transform -> Selection

```

## Desired interface

```typescript
// Creational
const button$ = $.button() // Creates empty button element
const section$ = $.section(`<h1>Title</h1>`) // Creates template element with inner HTML


// Selection
const button$ = $("button") // All buttons in document
const section$ = $("section", $otherElement) // All sections in $otherElement
const span$ = $("span", document.querySelector(".some-selector")) // All sections in a plain DOM element

// Output
const buttonElement = button$.toDOM()
const sectionElement = section$.toHTML()

// Update
button$.map(attr("data-size", "m"))
button$.map(class("isActive", "btn-primary"))
button$.pipe(attr("data-size", "m"), class("isActive", "btn-primary"))

```
