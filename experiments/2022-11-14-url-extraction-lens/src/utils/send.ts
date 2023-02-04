export interface TypedMessage {
  type: string;
  data?: any;
}

export function send<T extends TypedMessage>(sendFn: (message: any) => any, type: T["type"], data: T["data"]) {
  return sendFn({ type, data });
}
