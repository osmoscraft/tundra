export const demethodize = Function.prototype.bind.bind(Function.prototype.call);
export type Demethodized<P, Method extends keyof P> = <T extends P>(object: T, ...args: ParametersTypeOrNever<T[Method]>) => ReturnTypeOrNever<T[Method]>;

type ParametersTypeOrNever<MaybeFn> = MaybeFn extends (...args: infer ParametersType) => any ? ParametersType : never;
type ReturnTypeOrNever<MaybeFn> = MaybeFn extends () => infer ReturnType ? ReturnType : never;
