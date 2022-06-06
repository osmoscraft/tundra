import type { PickKeysByValueType } from "./pick-keys-by-value-type";

export class ProxyServer<TSchema extends BaseProxySchema> {
  onRequest<TRoute extends PickKeysByValueType<TSchema, RouteHandler>>(port: MessagePort, route: TRoute, handler: TSchema[TRoute]) {
    port.addEventListener("message", async (event) => {
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
