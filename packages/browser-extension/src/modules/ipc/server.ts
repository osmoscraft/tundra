export interface BaseRouteMap {
  requests: {
    [key: string]: [input: any, output: any];
  };
  subscriptions: never; // Not implemented
}

export type RequestInput<RouteMap extends BaseRouteMap, Route extends keyof RouteMap["requests"]> = RouteMap["requests"][Route][0];
export type RequestOutput<RouteMap extends BaseRouteMap, Route extends keyof RouteMap["requests"]> = RouteMap["requests"][Route][1];

export class WorkerServer<T extends BaseRouteMap> {
  constructor(private eventTarget: MessagePort | Worker) {}

  onRequest<RouteName extends keyof T["requests"]>(route: RouteName, handler: (data: any) => Promise<any>) {
    this.eventTarget.addEventListener("message", async (event) => {
      const { route: requestRoute, nonce, data } = (event as MessageEvent).data;

      if (!route === requestRoute) return;

      try {
        const responseData = await handler(data);

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
