import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { TarReader } from "../../../compression/tar";

export interface ZipItem {
  path: string;
  readAsText: () => string | Promise<string>;
}
export function downloadZip(url: string): AsyncGenerator<ZipItem> {
  async function* itemGenerator() {
    const zipReader = new ZipReader(new HttpReader(url));
    const entriesGen = zipReader.getEntriesGenerator();

    // TODO entry.getData has performance issue
    // TODO compare with tarball extraction performance
    for await (const entry of entriesGen) {
      const text = await entry.getData!(new TextWriter());
      yield { path: entry.filename, readAsText: () => text };
    }

    await zipReader.close();
  }

  return itemGenerator();
}

export interface TarballItem {
  path: string;
  readAsText: () => string | Promise<string>;
}
/**
 * CAUTION: Tarball filenames are truncated to 100 characters.
 */
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

      yield { path: fileInfo.name, readAsText: () => text };
    }
  }

  return itemGenerator();
}
