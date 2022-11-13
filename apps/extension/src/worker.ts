import type { GetEcho, SetRemote, WatchRemote } from "./routes";
import { onSubscribe, startServer } from "./utils/rpc/server";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const port = await startServer(self);
  const remoteTopic = new EventTarget();

  onSubscribe<GetEcho>(port, "getEcho", (req, next) => next(req));

  onSubscribe<WatchRemote>(port, "watchRemote", (_req, next) => {
    // TODO send initial value on subscribe
    const onChange = (e: Event) => next({ value: (e as CustomEvent).detail });
    remoteTopic.addEventListener("change", onChange);
    return () => remoteTopic.removeEventListener("change", onChange);
  });

  onSubscribe<SetRemote>(port, "setRemote", (req, next) => {
    remoteTopic.dispatchEvent(new CustomEvent("change", { detail: req }));
    console.log("TODO implement storing config in indexed DB");
  });
}

main();

export default self;
