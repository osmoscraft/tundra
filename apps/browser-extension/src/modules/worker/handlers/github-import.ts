import type { DbWorkerHandler } from "./base";

export const handleGithubImport: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubImport) return;

  context.syncService.importGithubArchive(message.requestGithubImport);

  // const onItem = async ({ path, readAsText }: ZipItem) => {
  //   const matchedPath = path.match(/(\/notes\/.*\.md)/)?.[0];
  //   if (!matchedPath) {
  //     console.log(`[import] skip ${path.slice(path.indexOf("/"))}`);
  //     return;
  //   }

  //   const content = await readAsText();
  //   console.log(`[import] accept ${matchedPath} (${content.length})`);
  //   await context.fileService.writeText(matchedPath, content);
  // };

  // await getArchive(message.requestGithubImport).then((archive) => downloadZip(archive.zipballUrl, onItem));

  context.respond(message, { respondGithubImport: true });
};
