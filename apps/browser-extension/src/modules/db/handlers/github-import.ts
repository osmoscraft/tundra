import { downloadZip, type ZipItem } from "../../sync/github/operations/download";
import { getArchive } from "../../sync/github/proxy/get-archive";
import INSERT_NODE from "../sql/insert-node.sql";
import type { DbWorkerHandler } from "./base";

export const handleGithubImport: DbWorkerHandler = async (context, message) => {
  if (!message.requestGithubImport) return;

  const onItem = ({ path, content }: ZipItem) => {
    return context.dbPromise.then((db) =>
      db.exec(INSERT_NODE, {
        bind: {
          ":path": path,
          ":content": content,
        },
      })
    );
  };

  await getArchive(message.requestGithubImport).then((archive) => downloadZip(archive.zipballUrl, onItem));

  context.respond(message, { respondGithubImport: true });
};
