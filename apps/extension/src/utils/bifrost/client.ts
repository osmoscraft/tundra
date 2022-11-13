import { uuid } from "../rand";
import type { ObservedData, PortMessage } from "./types";

export function getWorkerForEnv(useSharedWorker?: boolean) {
  return useSharedWorker ? SharedWorker : Worker;
}

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

// Client
export function subscribe(port: ClientPort, channel: string, observer: Observer, data: any) {
  const subscriptionId = uuid();

  const listener = (event: Event) => {
    const { sid, data } = (event as MessageEvent).data as PortMessage;
    if (sid !== subscriptionId) return;

    observer(data);

    if ((data as ObservedData).isComplete) {
      port.removeEventListener("message", listener);
    }
  };

  port.addEventListener("message", listener);
  port.postMessage({ channel, data, sid: subscriptionId });

  return () => port.removeEventListener("message", listener);
}

export async function request(port: ClientPort, channel: string, data: any) {
  return new Promise((resolve, reject) => {
    const observer: Observer = (data) => {
      if (data.value) resolve(data.value);
      if (data.error) reject(data.error);
      unsubscribe();
    };

    const unsubscribe = subscribe(port, channel, observer, data);
  });
}
