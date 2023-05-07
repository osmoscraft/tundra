import { decodeError, encodeError } from "./error";

type Fn<ArgsType extends any[] = any[], ReturnType = any> = (...args: ArgsType) => ReturnType;

type AsyncProxy<FnsMap> = {
  [K in keyof FnsMap]: FnsMap[K] extends Fn<infer ArgsType, infer ReturnType>
    ? Fn<ArgsType, Promise<Awaited<ReturnType>>>
    : never;
};

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

export interface Client<T extends {}> {
  proxy: AsyncProxy<T>;
  stop: () => any;
}

export function client<T extends {}>(config: { channel: IChannel }): Client<T> {
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

export interface Server {
  stop: () => any;
}

export function server(config: { channel: IChannel; routes: Record<string, Fn> }): Server {
  const handleChannelData = async (data: any) => {
    const { header, payload } = data;

    const createMessage: (payload: any) => IMessage = (payload) => ({ header: { mid: header.mid }, payload });

    try {
      const output = await config.routes[payload.prop](payload.args);
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
