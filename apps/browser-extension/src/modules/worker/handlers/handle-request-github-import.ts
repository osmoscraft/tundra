import type { ZipItem } from "../../sync/github/operations/download";
import type { DbWorkerHandler } from "./base";

export const handleRequestGithubImport: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubImport) return;

  const handleGithubArchiveItem = async (item: ZipItem) => {
    const parsedPath = parseGithubZipItemPath(item.path);
    if (!parsedPath.localMarkdownNotePath) {
      console.log(`[import] skip ${item.path.slice(item.path.indexOf("/"))}`);
      return;
    }
    const content = await item.readAsText();
    console.log(`[import] accept ${parsedPath.localMarkdownNotePath} (size: ${content.length})`);
    await context.fileService.writeText(parsedPath.localMarkdownNotePath, content);
  };

  await context.syncService.importGithubArchive(handleGithubArchiveItem);

  context.respond(message, { respondGithubImport: true });
};

interface ParsedPath {
  archivePath: string;
  localMarkdownNotePath?: string;
}
function parseGithubZipItemPath(zipItemPath: string): ParsedPath {
  return {
    archivePath: zipItemPath,
    localMarkdownNotePath: zipItemPath.match(/(\/notes\/.*\.md)/)?.[0],
  };
}
