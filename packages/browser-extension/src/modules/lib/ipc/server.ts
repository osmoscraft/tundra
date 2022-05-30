export type BaseRequestRoutes = Record<string, [InputType: any, OutputType: any]>;

export type RequestRouteHandler<RouteMap extends BaseRequestRoutes, RouteName extends keyof RouteMap> = (
  ...data: RouteMap[RouteName][0] extends void ? [] : [RouteMap[RouteName][0]]
) => Promise<RouteMap[RouteName][1] extends void ? void : RouteMap[RouteName][1]>;

export class WorkerServer<RequestRoutes extends BaseRequestRoutes> {
  constructor(private eventTarget: MessagePort | Worker) {}

  onRequest<RouteName extends keyof RequestRoutes>(route: RouteName, handler: RequestRouteHandler<RequestRoutes, RouteName>) {
    this.eventTarget.addEventListener("message", async (event) => {
      const { route: requestRoute, nonce, data } = (event as MessageEvent).data;

      if (!route === requestRoute) return;

      try {
        const responseData = await handler(...([data] as any));

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

  onSubscribe() {
    throw new Error("Not implemented");
  }
}
