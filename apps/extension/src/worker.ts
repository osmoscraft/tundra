import { dbAsync, getRemote, RemoteType, setRemote } from "./features/db";
import { clone, testConnection } from "./features/github/github";
import { getLogger } from "./features/log";
import type { EchoGet, LogWatch, RemoteUpdate, RemoteWatch, RepoClone, RepoTest } from "./routes";
import { addRoute, startServer } from "./utils/rpc/server-utils";

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
    logger.info("Clone starting...");
    const db = await dbAsync;
    const remote = await getRemote(db);

    if (!remote) {
      next({ isComplete: true, error: "Remote does not exist" });
      return;
    }

    await clone(logger, remote.connection);

    next({ isComplete: true });
  });

  addRoute<RepoTest>(port, "repo/test", async (req, next) => {
    logger.info("Test starting...");
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
