import { downloadZip, type ZipItem } from "../../sync/github/operations/download";
import { getArchive } from "../../sync/github/proxy/get-archive";
import INSERT_NODE from "../sql/insert-node.sql";
import type { DbWorkerHandler } from "./base";

export const handleGithubImport: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubImport) return;

  const onItem = async ({ path, readAsText }: ZipItem) => {
    const matchedPath = path.match(/(\/notes\/.*\.md)/)?.[0];
    if (!matchedPath) {
      console.log(`[import] skip ${path.slice(path.indexOf("/"))}`);
      return;
    }

    const content = await readAsText();
    console.log(`[import] accept ${matchedPath} (${content.length})`);
    return context.dbPromise.then((db) =>
      db.exec(INSERT_NODE, {
        bind: {
          ":path": matchedPath,
          ":content": content,
        },
      })
    );
  };

  await getArchive(message.requestGithubImport).then((archive) => downloadZip(archive.zipballUrl, onItem));

  context.respond(message, { respondGithubImport: true });
};
