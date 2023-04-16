import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";

export interface ZipItem {
  path: string;
  readAsText: () => Promise<string>;
}
export function downloadZip(url: string): AsyncGenerator<ZipItem> {
  async function* itemGenerator() {
    const zipReader = new ZipReader(new HttpReader(url));
    const entriesGen = zipReader.getEntriesGenerator();

    for await (const entry of entriesGen) {
      yield { path: entry.filename, readAsText: () => entry.getData!(new TextWriter()) };
    }

    await zipReader.close();
  }

  return itemGenerator();
}
