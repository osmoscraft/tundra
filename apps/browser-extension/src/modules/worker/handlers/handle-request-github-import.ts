import type { DbWorkerHandler } from "./base";

export const handleRequestGithubImport: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubImport) return;

  performance.mark("import-start");
  for await (const item of context.syncService.importGithubArchive()) {
    const parsedPath = parseGithubZipItemPath(item.path);
    if (!parsedPath.localMarkdownNotePath) {
      console.log(`[import] skip ${item.path.slice(item.path.indexOf("/"))}`);
    } else {
      const content = await item.readAsText();
      console.log(`[import] accept ${parsedPath.localMarkdownNotePath} (size: ${content.length})`);
      await context.fileService.writeText(parsedPath.localMarkdownNotePath, content);
    }
  }
  console.log("[perf] import", performance.measure("import duration", "import-start").duration);

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
