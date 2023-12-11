import type { FirstInArrayOrAny, Fn, LastInArrayOrAny } from "./type";

export function pipe<T extends Fn[]>(
  ...fns: T
): (...args: Parameters<FirstInArrayOrAny<T>>) => ReturnType<LastInArrayOrAny<T>> {
  return ((x: any) => fns.reduce((v, f) => f(v), x)) as any;
}

// Once an a step returns nullish, skip the rest of the steps and just return null
export function shortPipe<T extends Fn[]>(
  ...fns: T
): (...args: Parameters<FirstInArrayOrAny<T>>) => null | ReturnType<LastInArrayOrAny<T>> {
  return ((x: any) => fns.reduce((v, f) => (v === null || v === undefined ? v : f(v)), x) ?? null) as any;
}

export function asyncPipe<T extends Fn[]>(
  ...fns: T
): (...args: Parameters<FirstInArrayOrAny<T>>) => Promise<Awaited<ReturnType<LastInArrayOrAny<T>>>> {
  return ((x: any) => fns.reduce((v, f) => v.then(f), Promise.resolve(x))) as any;
}
