export const getActiveTab = () => chrome.tabs.query({ active: true, currentWindow: true, windowType: "normal" });

export const getFirstTab = (tabs: chrome.tabs.Tab[]) => tabs[0] as chrome.tabs.Tab | undefined;

export const ensureWebPageTab = (tab?: chrome.tabs.Tab) =>
  tab?.url && tab?.id ? Promise.resolve(tab) : Promise.reject("Tab missing URL or ID");

export const getTabUrl = (tab: chrome.tabs.Tab) => tab.url!;
export const getTabId = (tab: chrome.tabs.Tab) => tab.id!;

export const getTabMetadata = (tab: chrome.tabs.Tab) => ({ url: tab.url!, title: tab.title! });

export const getActiveTabId = () => getActiveTab().then(getFirstTab).then(ensureWebPageTab).then(getTabId);
export const getActiveTabUrl = () => getActiveTab().then(getFirstTab).then(ensureWebPageTab).then(getTabUrl);

export const getActiveTabMetadata = () => getActiveTab().then(getFirstTab).then(ensureWebPageTab).then(getTabMetadata);

export function sendToPort(port: chrome.runtime.Port) {
  return port.postMessage.bind(port);
}
