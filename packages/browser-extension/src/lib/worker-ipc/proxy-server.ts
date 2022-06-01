import type { PickKeysByValueType } from "./pick-keys-by-value-type";

export interface ProxyServerConfig<TContext> {
  onGetContext: () => Promise<TContext>;
}
export class ProxyServer<TSchema extends BaseProxySchema, TContext> {
  constructor(private eventTarget: MessagePort | Worker, private config?: ProxyServerConfig<TContext>) {}

  onRequest<TRoute extends PickKeysByValueType<TSchema, RequestHandler>>(route: TRoute, handler: TSchema[TRoute]) {
    this.eventTarget.addEventListener("message", async (event) => {
      const { route: requestRoute, nonce, data } = (event as MessageEvent).data;

      if (route !== requestRoute) return;

      try {
        const context = await this.config?.onGetContext();
        const responseData = await handler({ input: data, context });

        this.eventTarget.postMessage({
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

        this.eventTarget.postMessage({
          nonce,
          error: serializableError,
          timestamp: Date.now(),
        });
      }
    });
  }
}

export type BaseProxySchema = Record<string, RequestHandler>;

export type RequestHandler<TIn = any, TOut = any, TContext = any> = (props: { input: TIn; context: TContext }) => Promise<TOut>;
