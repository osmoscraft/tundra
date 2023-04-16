import type { DbWorkerHandler } from "./base";

export const handleGithubImport: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubImport) return;

  await context.syncService.importGithubArchive(message.requestGithubImport, async (item) => {
    const localPath = githubZipItemPathToLocalPath(item.path);
    if (!localPath) {
      console.log(`[import] skip ${item.path.slice(item.path.indexOf("/"))}`);
      return;
    }
    const content = await item.readAsText();
    console.log(`[import] accept ${localPath} (size: ${content.length})`);
    await context.fileService.writeText(localPath, content);
  });

  context.respond(message, { respondGithubImport: true });
};

function githubZipItemPathToLocalPath(zipItemPath: string) {
  return zipItemPath.match(/(\/notes\/.*\.md)/)?.[0];
}
