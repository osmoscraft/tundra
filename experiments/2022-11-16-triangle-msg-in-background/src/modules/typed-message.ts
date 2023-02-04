import { MessageToBackground } from "../messages";

export interface TypedMessage {
  type: string;
  req?: any;
  res?: any;
}

export function postTypedMessage<T extends TypedMessage>(port: chrome.runtime.Port, type: T["type"], req: T["req"]) {
  return port.postMessage({ type, req });
}

export async function sendTypedRequest<T extends TypedMessage>(
  sendMessage: typeof chrome.runtime.sendMessage,
  type: T["type"],
  req: T["req"]
): Promise<T["res"]> {
  return sendMessage({ type, req });
}

export async function sendTypedResponse<T extends MessageToBackground>(
  sendResponse: (res: T["res"]) => any,
  res: T["res"]
) {
  return sendResponse(res);
}
