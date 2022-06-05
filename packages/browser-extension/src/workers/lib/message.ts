export function getRequestHandler<SchemaType extends Record<string, any>, KeyType extends keyof SchemaType>(
  handler: (input: SchemaType[KeyType][0]) => Promise<SchemaType[KeyType][1]>
): (event: MessageEvent) => Promise<{
  nonce: string;
  data?: any;
  error?: any;
  timestamp: number;
}> {
  return async function (event: MessageEvent) {
    const { nonce, data } = event.data;
    try {
      const responseData = await handler(data);

      const response = {
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

      const response = {
        nonce,
        error: serializableError,
        timestamp: Date.now(),
      };

      return response;
    }
  };
}
