import { onSubscribe, startServer } from "./utils/worker/server";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const port = await startServer(self);

  const configChange = new EventTarget();

  onSubscribe(port, "echo", (req, next) => {
    setInterval(() => next({ value: req }), 1000);
    return () => {};
  });

  onSubscribe(port, "config", (_req, next) => {
    const onChange = () => next({ value: "TODO implement storing config in indexed DB" });
    configChange.addEventListener("change", onChange);
    return () => configChange.removeEventListener("changed", onChange);
  });

  onSubscribe(port, "setConfig", (req, next) => {
    configChange.dispatchEvent(new CustomEvent("change"));
    console.log("TODO implement storing config in indexed DB");
  });
}

main();

export default self;
