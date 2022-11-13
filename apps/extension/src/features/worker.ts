import type { AppRoutes } from "../routes";
import { WorkerClient } from "../utils/worker-rpc";
import { env } from "./env";

export function createWorker() {
  console.log(`[get-worker] env: ${env.NODE_ENV}`);
  const workerInstance = env.NODE_ENV === "production" ? new SharedWorker("./worker.js") : new Worker("./worker.js");
  return new WorkerClient<AppRoutes>(workerInstance);
}

export async function startWorker(client: WorkerClient<AppRoutes>) {
  client.start();
  // ensure server is ready by testing with echo
  const res = await client.request("echo", { message: "ping" });
  if (res.message !== "ping") {
    throw new Error("Backend worker failed to respond");
  }

  return client;
}
