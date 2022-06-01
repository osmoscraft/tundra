import type { PickKeysByValueType } from "./pick-keys-by-value-type";
import type { BaseProxySchema, RequestHandler } from "./proxy-server";

export class ProxyClient<TSchema extends BaseProxySchema> {
  constructor(private eventTarget: MessagePort | Worker) {}

  async request<TRoute extends PickKeysByValueType<TSchema, RequestHandler>>(
    route: TRoute,
    ...dataList: TSchema[TRoute] extends RequestHandler<undefined> ? [] : TSchema[TRoute] extends RequestHandler<infer TIn> ? [data: TIn] : []
  ): Promise<TSchema[TRoute] extends RequestHandler<any, infer TOut> ? TOut : any> {
    return new Promise((resolve, reject) => {
      const nonce = crypto.randomUUID();
      const requestTimestamp = Date.now();

      const handleMessage: EventListener = (event) => {
        const { data, error, nonce: responseNonce, timestamp: responseTimestamp } = (event as MessageEvent).data;
        if (nonce !== responseNonce) return;

        this.eventTarget.removeEventListener("message", handleMessage);
        const duration = responseTimestamp - requestTimestamp;

        if (error) {
          console.error(`[request] ERR ${route} | ${duration}ms`, error);
          reject(error);
        } else {
          console.log(`[request] OK ${route} | ${duration}ms`);
          resolve(data);
        }
      };

      this.eventTarget.addEventListener("message", handleMessage);

      this.eventTarget.postMessage({
        route,
        data: dataList[0],
        nonce,
      });
    });
  }
}
