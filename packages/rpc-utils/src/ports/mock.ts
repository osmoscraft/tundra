import type { IPort } from "..";

export function getMockPorts(): {
  port1: IPort;
  port2: IPort;
  inspect: () => { port1Callbacks: any[]; port2Callbacks: any[] };
} {
  let port1Callbacks: any[] = [];
  let port2Callbacks: any[] = [];

  return {
    port1: {
      emit: (data: any) => port2Callbacks.forEach((handler) => handler(data)),
      on: (callback: (data: any) => void) => port1Callbacks.push(callback),
      off: (callback: (data: any) => void) =>
        (port1Callbacks = port1Callbacks.filter((port1Callback) => port1Callback != callback)),
    },
    port2: {
      emit: (data: any) => port1Callbacks.forEach((handler) => handler(data)),
      on: (callback: (data: any) => void) => port2Callbacks.push(callback),
      off: (callback: (data: any) => void) =>
        (port2Callbacks = port2Callbacks.filter((port2Callback) => port2Callback != callback)),
    },
    inspect: () => {
      return {
        port1Callbacks,
        port2Callbacks,
      };
    },
  };
}
