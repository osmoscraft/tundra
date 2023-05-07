import type { FirstInArrayOrAny, LastInArrayOrAny } from "./type";

export function compose<T extends any[]>(
  ...fns: T
): (...args: Parameters<LastInArrayOrAny<T>>) => ReturnType<FirstInArrayOrAny<T>> {
  return ((x: any) => fns.reduceRight((v, f) => f(v), x)) as any;
}
