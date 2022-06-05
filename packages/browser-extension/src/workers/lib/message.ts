export function getMessageSender<SchemaType extends Record<string, any>>(port: MessagePort) {
  return async function <RouteType extends keyof SchemaType>(
    route: RouteType,
    ...inputList: SchemaType[RouteType][0] extends undefined ? [] : [input: SchemaType[RouteType][0]]
  ): Promise<SchemaType[RouteType][1]> {
    return new Promise((resolve, reject) => {
      const nonce = crypto.randomUUID();
      const requestTimestamp = Date.now();

      const handleMessage = (event: MessageEvent<InternalResponseData>) => {
        const { data, error, nonce: responseNonce, timestamp: responseTimestamp } = event.data;
        if (nonce !== responseNonce) return;

        port.removeEventListener("message", handleMessage);
        const duration = responseTimestamp - requestTimestamp;

        if (error) {
          console.error(`[request] ERR ${route} | ${duration}ms`, error);
          reject(error);
        } else {
          console.log(`[request] OK ${route} | ${duration}ms`);
          resolve(data);
        }
      };

      port.addEventListener("message", handleMessage);

      const wrappedMessage: InternalRequestData = {
        route: route as string,
        nonce,
        timestamp: requestTimestamp,
        data: inputList[0],
      };

      port.postMessage(wrappedMessage);
    });
  };
}

export function getMessageHandler<SchemaType extends Record<string, any>, RouteType extends keyof SchemaType>(
  handler: (input: SchemaType[RouteType][0]) => Promise<SchemaType[RouteType][1]>
): (event: MessageEvent) => Promise<InternalResponseData> {
  return async function (event: MessageEvent<InternalRequestData>) {
    const { nonce, data } = event.data;
    try {
      const responseData = await handler(data);

      const response: InternalResponseData = {
        nonce,
        data: responseData,
        timestamp: Date.now(),
      };

      return response;
    } catch (error) {
      console.error(error);

      // We can't forward native error to the client due to Firefox limitation
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1556604
      const serializableError = {
        name: (error as Error).name ?? "Unknown error",
        message: (error as Error).message ?? "No error message available",
      };

      const response: InternalResponseData = {
        nonce,
        error: serializableError,
        timestamp: Date.now(),
      };

      return response;
    }
  };
}

// credit: https://stackoverflow.com/questions/70344859/
export type PickKeysByValueType<T, TYPE> = {
  [K in keyof T]: T[K] extends TYPE ? K : never;
}[keyof T];

interface InternalRequestData {
  route: string;
  nonce: string;
  timestamp: number;
  data?: any;
}

interface InternalResponseData {
  nonce: string;
  data?: any;
  error?: any;
  timestamp: number;
}
