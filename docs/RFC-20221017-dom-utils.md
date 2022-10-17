# DOM Utils

jQuery is replaced by platform standard APIs but it got a few design aspects right:

1. Chainablility
2. Monadic behavior on empty data
3. Polymorphic interface for both read and write (reduced cognitive load)

The goal is to produce a similar tool but with FP usage in mind. With additional traits desired:

1. Interoperability with symbol.iterable
2. Lazy evaluation for perf and runtime optimization
