import { curry } from "../functional/curry";

export const getField = curry((attr: string, obj: any) => obj[attr]);
export const setField = curry((attr: string, value: any, obj: any) => (obj[attr] = value));

export const first = <T>(array: T[]) => array[0];
