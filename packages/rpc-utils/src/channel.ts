import type { IChannel } from ".";

export function getMockChannelPair(): [IChannel, IChannel] {
  const port1Callbacks: any[] = [];
  const port2Callbacks: any[] = [];

  return [
    {
      emit: (data: any) => port2Callbacks.forEach((handler) => handler(data)),
      on: (callback: (data: any) => void) => port1Callbacks.push(callback),
      off: (callback: (data: any) => void) => port1Callbacks.filter((port1Callback) => port1Callback != callback),
    },
    {
      emit: (data: any) => port1Callbacks.forEach((handler) => handler(data)),
      on: (callback: (data: any) => void) => port2Callbacks.push(callback),
      off: (callback: (data: any) => void) => port2Callbacks.filter((port2Callback) => port2Callback != callback),
    },
  ];
}
