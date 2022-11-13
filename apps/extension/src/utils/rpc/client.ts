import { uuid } from "../rand";
import type { ObservedData, PortMessage } from "./types";

export function startClient(worker: SharedWorker | Worker) {
  // Shared Worker requires start
  if (worker instanceof SharedWorker) {
    worker.port.start();
    return worker.port;
  } else {
    return worker;
  }
}

export type Observer<T = any> = (data: ObservedData<T>) => void;
export type ClientPort = Pick<Worker | MessagePort, "postMessage" | "addEventListener" | "removeEventListener">;

export function subscribe(port: ClientPort, channel: string, observer: Observer, data: any) {
  const subscriptionId = uuid();

  const listener = (event: Event) => {
    const { sid, data } = (event as MessageEvent).data as PortMessage;
    if (sid !== subscriptionId) return;

    observer(data);

    if ((data as ObservedData).isComplete) {
      // naturally completed stream does not need abort
      port.removeEventListener("message", listener);
    }
  };

  port.addEventListener("message", listener);
  port.postMessage({ channel, data, sid: subscriptionId });

  return () => {
    port.removeEventListener("message", listener);
    port.postMessage({ channel, sid: subscriptionId, isAbort: true });
  };
}

export async function request(port: ClientPort, channel: string, data: any) {
  return new Promise((resolve, reject) => {
    const observer: Observer = (data) => {
      if (data.error) {
        reject(data.error);
      } else {
        resolve(data.value);
      }

      // unsub only if data isn't naturally completed
      if (!data.isComplete) unsubscribe();
    };

    const unsubscribe = subscribe(port, channel, observer, data);
  });
}
