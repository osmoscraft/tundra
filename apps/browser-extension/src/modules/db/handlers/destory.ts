export async function destoryDb(path: string) {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(path);
}
