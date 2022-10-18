import type { FirstInArray, LastInArray } from "../type";

export function compose<T extends any[]>(...fns: T): (...args: Parameters<LastInArray<T>>) => ReturnType<FirstInArray<T>> {
  return ((x: any) => fns.reduceRight((v, f) => f(v), x)) as any;
}
