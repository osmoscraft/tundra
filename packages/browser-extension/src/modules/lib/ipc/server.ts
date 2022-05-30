export type BaseRequestSchema = Record<string, [TIn: any, TOut: any]>;

export type RequestRouteHandler<TFunctionSignature extends [TIn: any, TOut: any]> = (
  props: RequestRouteHandlerProps<TFunctionSignature[0]>
) => Promise<TFunctionSignature[1]>;

export type RequestRouteHandlerProps<TInput> = {
  data: TInput;
};

export class WorkerServer<TRequestSchema extends BaseRequestSchema> {
  constructor(private eventTarget: MessagePort | Worker) {}

  onRequest<TRoute extends keyof TRequestSchema>(
    route: TRoute,
    handler: RequestRouteHandler<[TRequestSchema[TRoute][0], TRequestSchema[TRoute][1] extends void ? void : TRequestSchema[TRoute][1]]>
  ) {
    this.eventTarget.addEventListener("message", async (event) => {
      const { route: requestRoute, nonce, data } = (event as MessageEvent).data;

      if (!route === requestRoute) return;

      try {
        const responseData = await handler({ data });

        this.eventTarget.postMessage({
          nonce,
          data: responseData,
          timestamp: Date.now(),
        });
      } catch (error) {
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
