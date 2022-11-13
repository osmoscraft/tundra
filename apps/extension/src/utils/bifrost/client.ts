import { uuid } from "../rand";
import type { ObservedData, PortMessage } from "./types";

export async function start(port: Pick<MessagePort, "start"> | Partial<Worker>) {
  // Shared Worker requires start
  if (port instanceof MessagePort) {
    port.start();
  } else if (port instanceof Worker) {
    // noop
  }

  return port;
}

export interface Observer<T = any> {
  next: (data: ObservedData<T>) => void;
}
export type ClientPort = Pick<Worker | MessagePort, "postMessage" | "addEventListener" | "removeEventListener">;

// Client
export async function subscribe(port: ClientPort, channel: string, observer: Observer, data: any) {
  const subscriptionId = uuid();

  const listener = (event: Event) => {
    const { sid, data } = (event as MessageEvent).data as PortMessage;
    if (sid !== subscriptionId) return;

    observer.next(data);

    if ((data as ObservedData).isComplete) {
      port.removeEventListener("message", listener);
    }
  };

  port.addEventListener("message", listener);
  port.postMessage({ channel, data, sid: subscriptionId });

  return () => port.removeEventListener("message", listener);
}
