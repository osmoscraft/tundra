import type { Fn } from "./types";

export function once<T extends Fn>(fn: T): T {
  let called = false;
  let result: any;

  return ((...args: any[]) => {
    if (called) return result;

    result = fn(...args);
    called = true;

    return result;
  }) as any as T;
}
