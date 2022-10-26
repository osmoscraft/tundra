export type BaseProxySchema = Record<string, RouteHandler>;
export type RouteHandler<TIn = any, TOut = any> = (props: { req: TIn }) => Promise<TOut>;

// credit: https://stackoverflow.com/questions/70344859/
export type PickKeysByValueType<T, TYPE> = {
  [K in keyof T]: T[K] extends TYPE ? K : never;
}[keyof T];
