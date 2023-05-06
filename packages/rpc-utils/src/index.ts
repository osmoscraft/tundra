type Fn<T extends any[] = any[], K = any> = (...args: T) => K;
type Async<T> = T extends Promise<any> ? T : Promise<T>;

type ToAsyncFns<FnsMap> = {
  [K in keyof FnsMap]: FnsMap[K] extends Fn<infer Args, infer Return> ? Fn<Args, Async<Return>> : never;
};

export interface IClientPort {
  send: (data: any) => Promise<any>;
}

export function createClient<T extends {}>(port: IClientPort): ToAsyncFns<T> {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        return async (...args: any[]) => {
          return port.send({ prop, args });
        };
      },
    }
  ) as any;
}

export interface IServerPort {
  bind: (handler: any) => void;
}

export function createServer(handlers: {}, port: IServerPort) {
  port.bind(handlers);

  return {};
}
