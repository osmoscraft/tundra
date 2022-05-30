export class WorkerServer {
  constructor(private eventTarget: MessagePort | Worker) {}

  onRequest(route: string, handler: RequestHandler) {
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

export type RequestHandler<TIn = any, TOut = any> = (props: { data: TIn }) => Promise<TOut>;
