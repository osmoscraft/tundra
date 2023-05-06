import type { Async, FirstInArray, Fn, LastInArray } from "./type";

export function pipe<T extends Fn[]>(...fns: T): (...args: Parameters<FirstInArray<T>>) => ReturnType<LastInArray<T>> {
  return ((x: any) => fns.reduce((v, f) => f(v), x)) as any;
}

// Once an a step returns nullish, skip the rest of the steps and just return null
export function shortPipe<T extends Fn[]>(
  ...fns: T
): (...args: Parameters<FirstInArray<T>>) => null | ReturnType<LastInArray<T>> {
  return (((x: any) => fns.reduce((v, f) => (v === null || v === undefined ? v : f(v)), x)) as any) ?? null;
}

// A more efficient version of asyncPipe, which only awaits the last step
export function asyncPipe<T extends Fn[]>(
  ...fns: T
): (...args: Parameters<FirstInArray<T>>) => Async<ReturnType<LastInArray<T>>> {
  return ((x: any) => fns.reduce((v, f) => v.then(f), Promise.resolve(x))) as any;
}
