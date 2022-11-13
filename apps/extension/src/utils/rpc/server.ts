import type { ChannelOf, ObservedData, RequestOf, ResponseOf, Route } from "./types";

export async function startServer(
  worker: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope
): Promise<MessagePort | DedicatedWorkerGlobalScope> {
  return new Promise((resolve) => {
    if (isDedicatedWorker(worker)) {
      resolve(worker);
    } else {
      worker.addEventListener("connect", async (connectEvent) => {
        const port = connectEvent.ports[0];
        port.start();
        resolve(port);
      });
    }
  });
}

function isDedicatedWorker(
  worker: DedicatedWorkerGlobalScope | SharedWorkerGlobalScope
): worker is DedicatedWorkerGlobalScope {
  return typeof DedicatedWorkerGlobalScope !== "undefined";
}

export interface Observable {
  next: (value: any) => void;
}

export type OnAbort = () => any;
export type ServerPort = Pick<Worker | MessagePort, "postMessage" | "addEventListener" | "removeEventListener">;

export function addRoute<T extends Route>(
  port: ServerPort,
  channel: ChannelOf<T>,
  handler: (req: RequestOf<T>, next: (res: ObservedData<ResponseOf<T>>) => any) => void | OnAbort
) {
  const onMessageEvent = (event: Event) => {
    const { channel: receivedChannel, data, sid, isAbort } = (event as MessageEvent).data;
    if (channel !== receivedChannel) return;

    const abort = handler(data, (nextData) =>
      port.postMessage({
        channel,
        data: nextData,
        sid,
      })
    );

    if (isAbort) {
      abort?.();
    }
  };
  port.addEventListener("message", onMessageEvent);

  return () => port.removeEventListener("message", onMessageEvent);
}
