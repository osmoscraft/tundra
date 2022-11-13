import { dbAsync, getRemote, setRemote } from "./features/db";
import type { GetEcho, SetRemote, WatchRemote } from "./routes";
import { addRoute, startServer } from "./utils/rpc/server-utils";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const port = await startServer(self);
  const remoteTopic = new EventTarget();

  addRoute<GetEcho>(port, "getEcho", (req, next) => next(req));

  addRoute<WatchRemote>(port, "watchRemote", async (_req, next, onAbort) => {
    const db = await dbAsync;
    next({ value: await getRemote(db) });
    const onChange = async () => next({ value: await getRemote(db) });
    remoteTopic.addEventListener("change", onChange);
    onAbort(() => remoteTopic.removeEventListener("change", onChange));
  });

  addRoute<SetRemote>(port, "setRemote", async (req, next) => {
    const db = await dbAsync;
    await setRemote(db, req);
    remoteTopic.dispatchEvent(new Event("change"));
    next({ value: undefined, isComplete: true });
  });
}

main();

export default self;
