export const chain = function* <T1 = any, T2 = any>(transform: (node: T1) => undefined | null | T2 | Iterable<T2>, iterable: Iterable<T1>) {
  for (let item of iterable) {
    const result = transform(item);
    if (result === null || result === undefined) return undefined;

    if (Symbol.iterator in result) {
      yield* result as Iterable<T2>;
    } else {
      yield result as T2;
    }
  }
  return undefined;
};

export const from = (selector: string) => document.querySelectorAll(selector);

export class Nomad<T1 = any> {
  static $<T2 extends Element>(selector: string) {
    return new Nomad<T2>(document.querySelectorAll(selector));
  }

  constructor(private iterable: Iterable<T1>) {}

  *[Symbol.iterator]() {
    yield* this.iterable;
  }

  first() {}

  chain<T2 = any>(transform: (item: T1) => undefined | null | T2 | Iterable<T2>) {
    return new Nomad<T2>(chain<T1, T2>(transform, this.iterable));
  }
}
