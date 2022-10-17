export type FirstInArray<T extends any[]> = T extends [infer FirstType, ...any[]] ? FirstType : any;
export type LastInArray<T extends any[]> = T extends [...any[], infer LastType] ? LastType : any;

export type ParametersTypeOrNever<MaybeFn> = MaybeFn extends (...args: infer ParametersType) => any ? ParametersType : never;
export type ReturnTypeOrNever<MaybeFn> = MaybeFn extends () => infer ReturnType ? ReturnType : never;
