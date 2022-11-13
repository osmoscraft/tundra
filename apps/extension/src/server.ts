import { on, startServer } from "./utils/bifrost/server";

declare const self: SharedWorkerGlobalScope | DedicatedWorkerGlobalScope;

console.log("[worker] online");

async function main() {
  const port = await startServer(self);

  on(port, "echo", (req, next) => {});
}

main();

export default self;
