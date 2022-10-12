export type FirstInArray<T extends any[]> = T extends [infer FirstType, ...any[]] ? FirstType : any;
export type LastInArray<T extends any[]> = T extends [...any[], infer LastType] ? LastType : any;
