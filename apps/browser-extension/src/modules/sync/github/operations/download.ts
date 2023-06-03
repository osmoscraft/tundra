import { TarReader } from "../../../compression/tar";

export interface TarballItem {
  /** WARNING: Tarball filenames are truncated to 100 characters. */
  /** BUG: the suffix of the path can be truncated too, leaving no guarantee to the extension */
  path: string;
  text: string;
}
export function downloadTarball(url: string): AsyncGenerator<TarballItem> {
  async function* itemGenerator() {
    const blob = await fetch(url)
      .then((response) => response.body!.pipeThrough(new (globalThis as any).DecompressionStream("gzip")))
      .then((decompressedStream) => new Response(decompressedStream).blob());

    const tarReader = new TarReader();
    await tarReader.readFile(blob);

    for (const fileInfo of tarReader.getFileInfo()) {
      const text = tarReader.getTextFile(fileInfo.name);
      if (!text) continue;

      yield { path: fileInfo.name, text };
    }
  }

  return itemGenerator();
}
