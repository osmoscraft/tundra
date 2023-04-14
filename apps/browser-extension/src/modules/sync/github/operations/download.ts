import { HttpReader, TextWriter, ZipReader } from "@zip.js/zip.js";

export interface ZipItem {
  path: string;
  readAsText: () => Promise<string>;
}
export async function downloadZip(url: string, onItem: (item: ZipItem) => any): Promise<void> {
  const zipReader = new ZipReader(new HttpReader(url));
  const entriesGen = await zipReader.getEntriesGenerator();

  performance.mark("decompression-start");

  for await (const entry of entriesGen) {
    const textWriter = new TextWriter();
    await onItem({ path: entry.filename, readAsText: () => entry.getData!(textWriter) });
  }

  await zipReader.close();
  console.log("[perf] decompression", performance.measure("decompression", "decompression-start").duration);
}
