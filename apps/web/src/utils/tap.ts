import { curry } from "./curry.js";

export const tap: (fn: Function) => <T = any>(v: T) => T = curry((fn: Function, v: any) => {
  fn(v);
  return v;
});
