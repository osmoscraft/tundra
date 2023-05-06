export type RequestHandler = (...args: any[]) => any;
export type SubscriptionHandler = (...args: any[]) => EventTarget;

export interface PeerConfig<HandlersMap> {
  handlers: HandlersMap;
  remote: any;
}

export function createPeer<T extends {}>(config: PeerConfig<T>) {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop in config.handlers) {
          return (...args: any[]) => config.handlers[prop as string](...args);
        } else {
          throw new Error(`No handler for ${prop.toString()}`);
        }
      },
    }
  );
}

const serve = (() => {}) as any;

async function demo() {
  const handlers = {
    doSomething: async () => {},
    doSomethingElse: async () => {},
  };

  // server side
  const server = rx(handlers, self as WorkerGlobalScope);

  // client side
  const client = createClient<typeof handlers>({});
  client.doSomething();
}

export function createClient<T extends {}>(...args: any[]): T {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        return (...args: any[]) => {
          console.log("proxy called", { target, prop, args });
          // send message to worker
        };
      },
    }
  ) as T;
}
