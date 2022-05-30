export class WorkerClient {
  constructor(private eventTarget: MessagePort | Worker) {}

  async request(route: string): Promise<void>;
  async request<TOut = any>(route: string): Promise<TOut>;
  async request<TIn = any, TOut = any>(route: string, data: TIn): Promise<TOut>;
  async request<TIn = any, TOut = any>(route: string, data?: TIn): Promise<TOut> {
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
}
