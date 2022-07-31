export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
