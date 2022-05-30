import { BaseRequestSchema } from "./server";

export type RequestConfig<TInput> = TInput extends void
  ? {
      data: undefined;
    }
  : {
      data: TInput;
    };

export class WorkerClient<TRequestSchema extends BaseRequestSchema> {
  constructor(private eventTarget: MessagePort | Worker) {}

  async request<TRoute extends keyof TRequestSchema>(route: TRoute, config: RequestConfig<TRequestSchema[TRoute][0]>): Promise<TRequestSchema[TRoute][1]> {
    return new Promise((resolve, reject) => {
      const { data } = config;
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
}
