export const chain = function* <T1 = any, T2 = any>(transform: (node: T1, index: number) => undefined | null | T2 | Iterable<T2>, iterable: Iterable<T1>) {
  let index = 0;
  for (let item of iterable) {
    const result = transform(item, index++);
    if (result === null || result === undefined) return undefined;

    if (Symbol.iterator in result) {
      yield* result as Iterable<T2>;
    } else {
      yield result as T2;
    }
  }
  return undefined;
};

export class Nomad<T1 = any> {
  static $<T2 extends Element>(selector: string) {
    return new Nomad<T2>(document.querySelectorAll(selector));
  }

  constructor(private iterable: Iterable<T1>) {}

  *[Symbol.iterator]() {
    yield* this.iterable;
  }

  chain<T2 = any>(transform: (item: T1, index: number) => undefined | null | T2 | Iterable<T2>) {
    return new Nomad<T2>(chain<T1, T2>(transform, this.iterable));
  }
}
