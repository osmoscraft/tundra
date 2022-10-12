// Ref: https://stackoverflow.com/questions/63903982/how-to-write-curry-and-compose-in-typescript-4

type Curried<A extends any[], R> = <P extends Partial<A>>(
  ...args: P
) => P extends A ? R : A extends [...RelaxedTupleOf<P>, ...infer S] ? (S extends any[] ? Curried<S, R> : never) : never;

type RelaxedTupleOf<T extends any[]> = Extract<{ [K in keyof T]: any }, any[]>;

export function curry<ArgsType extends any[], ReturnType>(fn: (...args: ArgsType) => ReturnType): Curried<ArgsType, ReturnType> {
  return function curried(...args: any[]): any {
    return args.length >= fn.length ? fn(...(args as any)) : curried.bind(null, ...args);
  } as any;
}
