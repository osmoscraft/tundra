import { env } from "./features/env";
import { startClient } from "./utils/bifrost/client";

const isProd = env.NODE_ENV === "production";
console.log(`[options] ${isProd ? "prod" : "dev"} mode`);

export async function main() {
  const WorkerCtor = isProd ? SharedWorker : Worker;
  const worker = new WorkerCtor("./server.js");
  const port = startClient(worker);
}

main();
