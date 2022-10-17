export const chain = function* <T1 = any, T2 = any>(transform: (node: T1) => undefined | null | T2 | Iterable<T2>, iterable: Iterable<T1>) {
  for (let item of iterable) {
    const result = transform(item);
    if (result === null || result === undefined) return undefined;

    if (Symbol.iterator in result) {
      yield* result as Iterable<T2>;
    } else {
      yield result;
    }
  }
  return undefined;
};

export const from = (selector: string) => document.querySelectorAll(selector);

export class Nomad<K extends Element> {
  static of<T extends Element>(selector: string) {
    return new Nomad<T>(document.querySelectorAll(selector));
  }

  constructor(private iterable: Iterable<K>) {}

  *[Symbol.iterator]() {
    yield* this.iterable;
  }

  first() {}

  chain2<T extends Element>(transform: (node: K) => undefined | null | T | Iterable<T>) {
    return chain<K, T>(transform, this.iterable);
  }

  chain<T extends Element>(transform: (node: K) => undefined | null | T | Iterable<T>) {
    const newIter = (function* (context) {
      for (let item of context.iterable) {
        const result = transform(item);
        if (result === null || result === undefined) return undefined;

        if (Symbol.iterator in result) {
          yield* result as Iterable<any>;
        } else {
          yield result;
        }
      }

      return undefined;
    })(this);
    return new Nomad(newIter);
  }
}
