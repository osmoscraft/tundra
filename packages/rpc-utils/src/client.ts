import { decodeError } from "./error";
import type { AsyncProxy, Fn, IPort, IPortMessage } from "./types";

export interface Client<T extends {}> {
  proxy: AsyncProxy<T>;
  stop: () => any;
}

export function client<T extends {}>(config: { port: IPort }): Client<T> {
  const callbackMap = new Map<string, Fn>();
  const handlePortMessage = ({ header, payload }: IPortMessage) => {
    const callback = callbackMap.get(header.mid);
    callback?.(payload);
  };

  const stop = () => config.port.off(handlePortMessage);
  config.port.on(handlePortMessage);

  const proxy = new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        (...args: any[]) =>
          new Promise((resolve, reject) => {
            const currentMid = crypto.randomUUID();

            const packet = { header: { mid: currentMid, type: "req" as const }, payload: { prop, args } };

            const callback = (payload: { result: any; error: any }) => {
              callbackMap.delete(currentMid);
              if (Object.hasOwn(payload, "error")) {
                reject(decodeError(payload.error));
              } else {
                resolve(payload.result);
              }
            };

            callbackMap.set(currentMid, callback);
            config.port.emit(packet);
          }),
    }
  ) as AsyncProxy<T>;

  return {
    proxy,
    stop,
  };
}
