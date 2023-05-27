import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";

export interface ZipItem {
  path: string;
  readAsText: () => string | Promise<string>;
}
export function downloadZip(url: string): AsyncGenerator<ZipItem> {
  async function* itemGenerator() {
    const zipReader = new ZipReader(new HttpReader(url));
    const entriesGen = zipReader.getEntriesGenerator();

    // TODO entry.getData has performance issue
    for await (const entry of entriesGen) {
      const text = await entry.getData!(new TextWriter());
      yield { path: entry.filename, readAsText: () => text };
    }

    await zipReader.close();
  }

  return itemGenerator();
}
