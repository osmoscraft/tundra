import { encodeError } from "./error";
import type { Fn, IPort, IPortMessage } from "./types";

export interface Server {
  stop: () => any;
}

export function server(config: { port: IPort; routes: Record<string, Fn> }): Server {
  const handleChannelMessage = async ({ header, payload }: IPortMessage) => {
    const createResponse: (payload: any) => IPortMessage = (payload) => ({ header: { mid: header.mid }, payload });

    try {
      const output = await config.routes[payload.prop](payload.args);
      config.port.emit(createResponse({ result: output }));
    } catch (e: any) {
      config.port.emit(createResponse({ result: null, error: encodeError(e) }));
    }
  };

  const stop = () => config.port.off(handleChannelMessage);
  config.port.on(handleChannelMessage);

  return {
    stop,
  };
}
