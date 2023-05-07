import type { FirstInArrayOrVoid } from "./type";

export function tap(fn: Function) {
  return function tapped<T extends any[]>(...args: T): FirstInArrayOrVoid<T> {
    fn(args[0]);
    return args[0];
  };
}

export function asyncTap(fn: Function) {
  async function tapped(): Promise<void>;
  async function tapped<T>(v: T): Promise<T>;
  async function tapped(v?: any) {
    await fn(v);
    return v;
  }

  return tapped;
}
