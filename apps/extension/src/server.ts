import { on, startServer } from "./utils/bifrost/server";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const port = await startServer(self);

  on(port, "echo", (req, next) => {
    setInterval(() => next({ value: req }), 1000);

    return () => {};
  });
}

main();

export default self;
