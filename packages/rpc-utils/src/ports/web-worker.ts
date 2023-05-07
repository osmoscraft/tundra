import type { IPort } from "..";

export function dedicatedWorkerPort(dedicatedWorkerGlobalScope: DedicatedWorkerGlobalScope): IPort {
  return messageEventPort(dedicatedWorkerGlobalScope);
}

export function dedicatedWorkerHostPort(worker: Worker): IPort {
  return messageEventPort(worker);
}

function messageEventPort(eventTarget: MessageEventTarget): IPort {
  const callbacksMap = new Map<any, any>();

  return {
    emit: (data: any) => eventTarget.postMessage(data),
    on: (callback: (data: any) => void) => {
      const wrappedCallback = (message: MessageEvent) => callback(message.data);
      callbacksMap.set(callback, wrappedCallback);
      eventTarget.addEventListener("message", wrappedCallback);
    },
    off: (callback: (data: any) => void) => {
      const wrappedCallback = callbacksMap.get(callback);
      if (wrappedCallback) {
        eventTarget.removeEventListener("message", wrappedCallback);
      }
    },
  };
}

export interface MessageEventTarget {
  postMessage(message: any): any;
  addEventListener(type: "message", listener: (ev: MessageEvent) => any): any;
  removeEventListener(type: "message", listener: (ev: MessageEvent) => any): any;
}
