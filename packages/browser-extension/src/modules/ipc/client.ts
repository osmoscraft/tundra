import { BaseRouteMap } from "./server";

export class WorkerClient<T extends BaseRouteMap> {
  constructor(private eventTarget: MessagePort | Worker) {}

  async request<RouteName extends keyof T>(route: RouteName, ...data: T[RouteName][0] extends void ? [] : [T[RouteName][0]]): Promise<T[RouteName][1]>;
  async request<RouteName extends keyof T>(route: RouteName, data?: T[RouteName][0]): Promise<T[RouteName][1]> {
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
        data,
        nonce,
      });
    });
  }

  subscribe() {
    throw new Error("Not implemented");
  }
}
