import { getActiveTab } from "./browser";

export interface TypedMessage {
  type: string;
  req?: any;
  res?: any;
}

// * -> Background
// * -> Popup

export function postRuntimMessage<T extends TypedMessage>(port: chrome.runtime.Port, type: T["type"], req: T["req"]) {
  return port.postMessage({ type, req });
}

export async function sendRuntimRequest<T extends TypedMessage>(
  sendMessage: typeof chrome.runtime.sendMessage,
  type: T["type"],
  req: T["req"]
): Promise<T["res"]> {
  return sendMessage({ type, req });
}

export async function sendRuntimeResponse<T extends TypedMessage>(sendResponse: (res: T["res"]) => any, res: T["res"]) {
  return sendResponse(res);
}

// * -> Content

export async function sendTabsRequest<T extends TypedMessage>(
  sendMessage: typeof chrome.tabs.sendMessage,
  type: T["type"],
  req: T["req"]
): Promise<T["res"]> {
  const activeTab = await getActiveTab();
  return sendMessage(activeTab[0].id!, { type, req });
}
