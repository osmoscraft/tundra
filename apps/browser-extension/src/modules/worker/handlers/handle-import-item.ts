import type { DbWorkerEventHandler } from "../../../db-worker";
import type { ImportItemInit } from "../../sync";
import type { DbWorkerContext } from "./base";

export const handleImportItem: DbWorkerEventHandler = async (context: DbWorkerContext, e: Event) => {
  const { path, readAsText } = (e as CustomEvent<ImportItemInit>).detail;
  const matchedPath = path.match(/(\/notes\/.*\.md)/)?.[0];
  if (!matchedPath) {
    console.log(`[import] skip ${path.slice(path.indexOf("/"))}`);
    return;
  }

  const content = await readAsText();
  console.log(`[import] accept ${matchedPath} (${content.length})`);
  await context.fileService.writeText(matchedPath, content);
};
