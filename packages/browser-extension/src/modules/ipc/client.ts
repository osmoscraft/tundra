export class WorkerClient {
  constructor(private eventTarget: MessagePort | Worker) {}

  async request(route: string, data?: any) {
    return new Promise((resolve, reject) => {
      const nonce = crypto.randomUUID();
      const requestTimestamp = Date.now();

      const handleMessage: EventListener = (event) => {
        const { data, error, nonce: responseNonce, timestamp: responseTimestamp } = (event as MessageEvent).data;
        if (nonce !== responseNonce) return;

        this.eventTarget.removeEventListener("message", handleMessage);

        if (error) {
          console.log(`[request] ERR ${route}`);
          reject(error);
        } else {
          console.log(`[request] OK ${route} | ${responseTimestamp - requestTimestamp}ms`);
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
    // TODO implement
  }
}
