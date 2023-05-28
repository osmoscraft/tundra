import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { TarReader } from "../../../compression/tar";

export interface ZipItem {
  path: string;
  text: string;
}
export function downloadZip(url: string): AsyncGenerator<ZipItem> {
  async function* itemGenerator() {
    const zipReader = new ZipReader(new HttpReader(url));
    const entriesGen = zipReader.getEntriesGenerator();

    // WARNING entry.getData has performance issue
    for await (const entry of entriesGen) {
      yield { path: entry.filename, text: await entry.getData!(new TextWriter()) };
    }

    await zipReader.close();
  }

  return itemGenerator();
}

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
