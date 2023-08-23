import { broadcast as broadcastByChannel, until as untilByChannel } from "./broadcast-by-channel";
import { broadcast as broadcastByStorage, init, until as untilByStorage } from "./broadcast-by-storage";

export interface Tabset<T> {
  broadcast: (message: T) => void;
  until: (handler: (message: T) => boolean | Promise<boolean>) => void;
}

export function createTabsetByChannel<T>(channel: BroadcastChannel): Tabset<T> {
  return {
    broadcast: (message) => broadcastByChannel(channel, message),
    until: (handler) => untilByChannel(channel, handler),
  };
}

export function createTabsetByStorage<T>(window: Window): Tabset<T> {
  init(window.localStorage);

  return {
    broadcast: (message) => broadcastByStorage(window.localStorage, message),
    until: (handler) => untilByStorage(window, window.localStorage, handler),
  };
}
