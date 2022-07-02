import type { PickKeysByValueType } from "./pick-keys-by-value-type";

export class ProxyServer<TSchema extends BaseProxySchema> {
  private listeners: ((...args: any[]) => any)[] = [];

  constructor(private worker: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope) {}

  start() {
    if (this.isDedicatedWorker(this.worker)) {
      this.bindListeners(this.worker);
    } else {
      this.worker.addEventListener("connect", async (connectEvent) => {
        const port = connectEvent.ports[0];
        this.bindListeners(port);
        port.start();
      });
    }
  }

  private bindListeners(port: MessagePort | DedicatedWorkerGlobalScope) {
    this.listeners.forEach((listener) => port.addEventListener("message", listener.bind(this, port)));
  }

  private isDedicatedWorker(worker: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope): worker is DedicatedWorkerGlobalScope {
    return typeof DedicatedWorkerGlobalScope !== "undefined";
  }

  onRequest<TRoute extends PickKeysByValueType<TSchema, RouteHandler>>(route: TRoute, handler: TSchema[TRoute]) {
    this.listeners.push(async (port: MessagePort | DedicatedWorkerGlobalScope, event) => {
      const { route: requestRoute, nonce, data } = (event as MessageEvent).data;

      if (route !== requestRoute) return;

      try {
        const responseData = await handler({ input: data });

        port.postMessage({
          nonce,
          data: responseData,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error(error);

        // We can't forward native error to the client due to Firefox limitation
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1556604
        const serializableError = {
          name: (error as Error).name ?? "Unknown error",
          message: (error as Error).message ?? "No error message available",
        };

        port.postMessage({
          nonce,
          error: serializableError,
          timestamp: Date.now(),
        });
      }
    });
  }
}

export type BaseProxySchema = Record<string, RouteHandler>;

export type RouteHandler<TIn = any, TOut = any> = (props: { input: TIn }) => Promise<TOut>;
