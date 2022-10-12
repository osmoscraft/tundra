import type { ParametersTypeOrNever, ReturnTypeOrNever } from "./type";

export const demethodize = Function.prototype.bind.bind(Function.prototype.call);
export type Demethodized<P, Method extends keyof P> = <T extends P>(object: T, ...args: ParametersTypeOrNever<T[Method]>) => ReturnTypeOrNever<T[Method]>;
