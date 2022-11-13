import { uuid } from "../rand";
import type { ObservedData, PortMessage, Route } from "./types";

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

type ChannelOf<T extends Route> = T extends Route<infer K> ? K : string;
type RequestOf<T extends Route> = T extends Route<any, infer K> ? K : any;
type ResponseOf<T extends Route> = T extends Route<any, any, infer K> ? K : any;

export function subscribe<T extends Route>(
  port: ClientPort,
  channel: ChannelOf<T>,
  observer: Observer<ResponseOf<T>>,
  ...args: RequestOf<T> extends undefined ? [] : [data: RequestOf<T>]
) {
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
  port.postMessage({ channel, data: args[0], sid: subscriptionId });

  return () => {
    port.removeEventListener("message", listener);
    port.postMessage({ channel, sid: subscriptionId, isAbort: true });
  };
}

export async function request<T extends Route>(
  port: ClientPort,
  channel: ChannelOf<T>,
  ...args: RequestOf<T> extends undefined ? [] : [data: RequestOf<T>]
): Promise<ResponseOf<T>> {
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

    const unsubscribe = subscribe<any>(port, channel, observer, args[0]);
  });
}
