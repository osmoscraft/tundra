export type RequestMap = {
  setConfig: Route<any, any>;
};

export type SubscriptionMap = {
  config: Route<undefined, any>;
  log: Route<undefined, any>;
};

export type Route<TReq, TRes> = {
  req?: TReq;
  res: TRes;
};
