import { dbAsync, FrameStatus, getRemote, RemoteType, resetContent, setRemote } from "./features/db";
import { download, testConnection } from "./features/github/github";
import { getLogger } from "./features/log";
import type { EchoGet, LogWatch, RemoteUpdate, RemoteWatch, RepoClone, RepoTest } from "./routes";
import { addRoute, startServer } from "./utils/rpc/server-utils";
import { TarReader } from "./utils/tar";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const port = await startServer(self);
  const remoteTopic = new EventTarget();
  const logTopic = new EventTarget();
  const logger = getLogger(logTopic);

  addRoute<EchoGet>(port, "echo/get", (req, next) => next(req));

  addRoute<LogWatch>(port, "log/watch", (_req, next, onAbort) => {
    const onChange = (event: Event) => next({ value: (event as CustomEvent).detail });
    logTopic.addEventListener("log", onChange);
    onAbort(() => logTopic.removeEventListener("log", onChange));
  });

  addRoute<RemoteWatch>(port, "remote/watch", async (_req, next, onAbort) => {
    const db = await dbAsync;
    next({ value: await getRemote(db) });
    const onChange = async () => next({ value: await getRemote(db) });
    remoteTopic.addEventListener("change", onChange);
    onAbort(() => remoteTopic.removeEventListener("change", onChange));
  });

  addRoute<RemoteUpdate>(port, "remote/update", async (req, next) => {
    logger.info("Updating remote...");
    const db = await dbAsync;
    await setRemote(db, req);
    remoteTopic.dispatchEvent(new Event("change"));
    logger.info("Updating remote... Success");
    next({ value: undefined, isComplete: true });
  });

  addRoute<RepoClone>(port, "repo/clone", async (_req, next) => {
    logger.info("Clone started");
    const db = await dbAsync;
    const remote = await getRemote(db);

    if (!remote) {
      logger.info("Clone failed. Remote not found");
      next({ isComplete: true });
      return;
    }

    logger.info("Downloading files...");
    const { oid, blob } = await download(logger, remote.connection);
    if (!blob) {
      logger.info("Clone failed. Error downloading blob");
      next({ isComplete: true });
      return;
    }

    logger.info("Decoding blob...");
    const tarReader = new TarReader();
    await tarReader.readFile(blob);

    const files = tarReader.getFileInfo();
    logger.info(`Filter ${files.length} files to frames`);
    const frameStartIndex = files.findIndex((file) => file.type === "directory" && file.name.endsWith("/frames/"));
    const frames: [name: string, content: string][] = [];

    // Caveat: tar file name length limit may cause frame files to lose prefix
    for (let i = frameStartIndex + 1; i < files.length; i++) {
      if (files[i].type !== "file") break;
      const tarPath = files[i].name;
      const filename = tarPath.slice(tarPath.lastIndexOf("/") + 1);

      frames.push([filename, tarReader.getTextFile(tarPath)!]);
    }

    logger.info(`Loading ${frames.length} frames to DB`);

    const dbFrames = frames.map((frame) => ({
      id: frame[0],
      content: frame[1],
      dateUpdated: new Date(),
      status: FrameStatus.Clean,
    }));

    await resetContent(db, dbFrames, oid);
    logger.info(`Clone success`);

    next({ isComplete: true });
  });

  addRoute<RepoTest>(port, "repo/test", async (req, next) => {
    logger.info("Test... Started");
    if (req.type !== RemoteType.GitHubToken) return next({ error: "Unsupported remote", isComplete: true });
    try {
      await testConnection(logger, req.connection);
      next({ value: true, isComplete: true });
    } catch (error) {
      next({ error, isComplete: true });
    }
  });
}

main();

export default self;
