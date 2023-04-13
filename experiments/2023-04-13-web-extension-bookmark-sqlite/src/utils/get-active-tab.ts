export const getActiveTab = () => chrome.tabs.query({ active: true, currentWindow: true });
