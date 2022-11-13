import type { FirstInArray, LastInArray } from "./types";

export function pipe<T extends any[]>(...fns: T): (...args: Parameters<FirstInArray<T>>) => ReturnType<LastInArray<T>> {
  return ((x: any) => fns.reduce((v, f) => f(v), x)) as any;
}

// Once an a step returns nullish, skip the rest of the steps and just return null
export function shortPipe<T extends any[]>(
  ...fns: T
): (...args: Parameters<FirstInArray<T>>) => null | ReturnType<LastInArray<T>> {
  return (((x: any) => fns.reduce((v, f) => (v === null || v === undefined ? v : f(v)), x)) as any) ?? null;
}
