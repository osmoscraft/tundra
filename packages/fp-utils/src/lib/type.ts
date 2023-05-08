export type Fn<T extends any[] = any[], K = any> = (...args: T) => K;

export type FirstInArrayOrAny<T extends any[]> = FirstInArrayOr<T, any>;
export type FirstInArrayOrVoid<T extends any[]> = FirstInArrayOr<T, void>;
export type LastInArrayOrAny<T extends any[]> = LastInArrayOr<T, any>;

export type FirstInArrayOr<T extends any[], K> = T extends [infer FirstType, ...any[]] ? FirstType : K;
export type LastInArrayOr<T extends any[], K> = T extends [...any[], infer LastType] ? LastType : K;

export type ParametersTypeOrNever<MaybeFn> = MaybeFn extends (...args: infer ParametersType) => any
  ? ParametersType
  : never;
export type ReturnTypeOrNever<MaybeFn> = MaybeFn extends () => infer ReturnType ? ReturnType : never;
