export function getCleanUrl(dirtyUrl: string) {
  try {
    const mutableUrl = new URL(dirtyUrl);
    const mutableParams = mutableUrl.searchParams;
    [...mutableParams.keys()].filter((key) => key.startsWith("utm")).forEach((key) => mutableParams.delete(key));

    mutableUrl.hash = "";
    return mutableUrl.href;
  } catch {
    return dirtyUrl;
  }
}
