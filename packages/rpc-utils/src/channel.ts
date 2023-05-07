import type { IChannel } from ".";

export function getMockChannelPair(): {
  channel1: IChannel;
  channel2: IChannel;
  inspect: () => { channel1Callbacks: any[]; channel2Callbacks: any[] };
} {
  let channel1Callbacks: any[] = [];
  let channel2Callbacks: any[] = [];

  return {
    channel1: {
      emit: (data: any) => channel2Callbacks.forEach((handler) => handler(data)),
      on: (callback: (data: any) => void) => channel1Callbacks.push(callback),
      off: (callback: (data: any) => void) =>
        (channel1Callbacks = channel1Callbacks.filter((port1Callback) => port1Callback != callback)),
    },
    channel2: {
      emit: (data: any) => channel1Callbacks.forEach((handler) => handler(data)),
      on: (callback: (data: any) => void) => channel2Callbacks.push(callback),
      off: (callback: (data: any) => void) =>
        (channel2Callbacks = channel2Callbacks.filter((port2Callback) => port2Callback != callback)),
    },
    inspect: () => {
      return {
        channel1Callbacks,
        channel2Callbacks,
      };
    },
  };
}
