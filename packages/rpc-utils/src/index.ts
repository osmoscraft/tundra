import { decodeError, encodeError } from "./error";

type Fn<T extends any[] = any[], K = any> = (...args: T) => K;

type AsyncProxy<FnsMap> = {
  [K in keyof FnsMap]: FnsMap[K] extends Fn<infer Args, infer Return> ? Fn<Args, Promise<Awaited<Return>>> : never;
};

Promise.resolve();

export interface IChannel {
  emit: (message: IMessage) => any;
  on: (callback: (message: IMessage) => void) => void;
  off: (callback: (message: IMessage) => void) => void;
}

export interface IMessage {
  header: {
    mid: string;
  };
  payload: any;
}

export interface Tx<T extends {}> {
  proxy: AsyncProxy<T>;
  stop: () => any;
}

export function tx<T extends {}>(config: { channel: IChannel }): Tx<T> {
  const callbackMap = new Map<string, Fn>();
  const handleChannelMessage = ({ header, payload }: IMessage) => {
    const callback = callbackMap.get(header.mid)!;
    callback(payload);
  };

  let mid = 0;

  const stop = () => config.channel.off(handleChannelMessage);
  config.channel.on(handleChannelMessage);

  const proxy = new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        (...args: any[]) =>
          new Promise((resolve, reject) => {
            const currentMid = (++mid % Number.MAX_SAFE_INTEGER).toString();

            const packet = { header: { mid: currentMid }, payload: { prop, args } };

            const callback = (payload: { result: any; error: any }) => {
              callbackMap.delete(currentMid);
              if (Object.hasOwn(payload, "error")) {
                reject(decodeError(payload.error));
              } else {
                resolve(payload.result);
              }
            };

            callbackMap.set(currentMid, callback);
            config.channel.emit(packet);
          }),
    }
  ) as AsyncProxy<T>;

  return {
    proxy,
    stop,
  };
}

export interface Rx {
  stop: () => any;
}

export function rx(config: { channel: IChannel; handlers: Record<string, Fn> }): Rx {
  const handleChannelData = async (data: any) => {
    const { header, payload } = data;

    const createMessage: (payload: any) => IMessage = (payload) => ({ header: { mid: header.mid }, payload });

    try {
      const output = await config.handlers[payload.prop](payload.args);
      config.channel.emit(createMessage({ result: output }));
    } catch (e: any) {
      config.channel.emit(createMessage({ result: null, error: encodeError(e) }));
    }
  };

  const stop = () => config.channel.off(handleChannelData);
  config.channel.on(handleChannelData);

  return {
    stop,
  };
}
