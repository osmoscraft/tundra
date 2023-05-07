import type { Fn } from "./type";

/**
 * Make sure a function is only called once.
 * Subsequent calls will return the same result.
 */
export function callOnce<F extends Fn>(fn: F): F {
  let called = false;
  let result: ReturnType<F>;

  return ((...args: any) => {
    if (called) return result;
    called = true;
    return (result = fn(...args));
  }) as F;
}
