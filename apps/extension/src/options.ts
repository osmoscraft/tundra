import { ConfigElement } from "./features/config/config-form";
import { env } from "./features/env";
import { request, startClient, subscribe } from "./utils/worker/client";

export async function main() {
  const isProd = env.NODE_ENV === "production";
  console.log(`[options] ${isProd ? "prod" : "dev"} mode`);

  customElements.define("config-element", ConfigElement);
  const WorkerCtor = isProd ? SharedWorker : Worker;
  const worker = new WorkerCtor("./worker.js");
  const port = startClient(worker);

  const unsub = subscribe(port, "echo", console.log, 1);
  setTimeout(unsub, 3000);

  const value = await request(port, "echo", 3);
  console.log(value);
}

main();
