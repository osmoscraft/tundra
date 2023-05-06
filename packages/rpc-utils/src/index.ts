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

async function demo() {
  // ideal interface
  const server = createPeer({
    requestSomething: (req: any) => {}, // register a handler
    subscribeToSomething: () => new EventTarget(), // register a subscription
    generateSomething: function* generator() {}, // register a generator
  }).inbound(workerPort(self as WorkerGlobalScope));
  server.stop();

  const client = createClient({} as Worker).outbound();
  const response = await client.requestSomething({});
  const unsub = await client.subscribeToSomething();
  await client.generateSomething().next();

  function createClient(config: any) {
    return {} as any;
  }
  function createPeer(config: any) {
    return {} as any;
  }

  function workerPort(worker: WorkerGlobalScope) {
    return {} as any;
  }
}
