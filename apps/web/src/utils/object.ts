import { curry } from "./functional/curry";

export const getProp = curry((key: string | number, object: any) => {
  return object[key];
});

export const setProp = curry((key: string | number, value: any, object: any) => {
  object[key] = value;
  return object;
});

export const applyProp = curry((key: string | number, args: any[], object: any) => object[key](...args));
