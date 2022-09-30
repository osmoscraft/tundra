export function ensureUrlParam(url: URL, key: string, fallbackValue: string): boolean {
  if (!url.searchParams.has(key)) {
    location.search = new URLSearchParams({ [key]: fallbackValue }).toString();
    return false;
  }

  return true;
}
