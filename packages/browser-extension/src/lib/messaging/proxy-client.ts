import type { PickKeysByValueType } from "./pick-keys-by-value-type";
import type { BaseProxySchema, RouteHandler } from "./proxy-server";

export class ProxyClient<TSchema extends BaseProxySchema> {
  async request<TRoute extends PickKeysByValueType<TSchema, RouteHandler>>(
    port: MessagePort,
    route: TRoute,
    ...dataList: TSchema[TRoute] extends RouteHandler<undefined> ? [] : TSchema[TRoute] extends RouteHandler<infer TIn> ? [data: TIn] : []
  ): Promise<TSchema[TRoute] extends RouteHandler<any, infer TOut> ? TOut : any> {
    return new Promise((resolve, reject) => {
      const nonce = crypto.randomUUID();
      const requestTimestamp = Date.now();

      const handleMessage: EventListener = (event) => {
        const { data, error, nonce: responseNonce, timestamp: responseTimestamp } = (event as MessageEvent).data;
        if (nonce !== responseNonce) return;

        port.removeEventListener("message", handleMessage);
        const duration = responseTimestamp - requestTimestamp;

        if (error) {
          console.error(`[request] ERR ${route} | ${duration}ms`, error);
          reject(error);
        } else {
          console.log(`[request] OK ${route} | ${duration}ms`);
          resolve(data);
        }
      };

      port.addEventListener("message", handleMessage);

      port.postMessage({
        route,
        data: dataList[0],
        nonce,
      });
    });
  }
}
