import type { BaseProxySchema, PickKeysByValueType, RouteHandler } from "./types";

export class WorkerClient<TSchema extends BaseProxySchema> {
  private port: Worker | MessagePort;

  constructor(worker: Worker | SharedWorker) {
    if (worker instanceof SharedWorker) {
      this.port = worker.port;
    } else {
      this.port = worker;
    }
  }

  start() {
    if (this.port instanceof MessagePort) {
      this.port.start();
    }
    return this;
  }

  async request<TRoute extends PickKeysByValueType<TSchema, RouteHandler>>(
    route: TRoute,
    ...dataList: TSchema[TRoute] extends RouteHandler<undefined>
      ? []
      : TSchema[TRoute] extends RouteHandler<infer TIn>
      ? [data: TIn]
      : []
  ): Promise<TSchema[TRoute] extends RouteHandler<any, infer TOut> ? TOut : any> {
    return new Promise((resolve, reject) => {
      const nonce = crypto.randomUUID();
      const requestTimestamp = Date.now();

      const handleMessage: EventListener = (event) => {
        const { data, error, nonce: responseNonce, timestamp: responseTimestamp } = (event as MessageEvent).data;
        if (nonce !== responseNonce) return;

        this.port.removeEventListener("message", handleMessage);
        const duration = responseTimestamp - requestTimestamp;

        if (error) {
          console.error(`[request] ERR ${route as string} | ${duration}ms`, error);
          reject(error);
        } else {
          console.log(`[request] OK ${route as string} | ${duration}ms`);
          resolve(data);
        }
      };

      this.port.addEventListener("message", handleMessage);

      this.port.postMessage({
        route,
        data: dataList[0],
        nonce,
      });
    });
  }
}
