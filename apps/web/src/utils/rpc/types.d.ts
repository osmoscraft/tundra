export type BaseProxySchema = Record<string, RouteHandler>;
export type RouteHandler<ReqType = any, ResType = any> = (props: { req: ReqType }) => Promise<ResType>;

// credit: https://stackoverflow.com/questions/70344859/
export type PickKeysByValueType<T, TYPE> = {
  [K in keyof T]: T[K] extends TYPE ? K : never;
}[keyof T];
