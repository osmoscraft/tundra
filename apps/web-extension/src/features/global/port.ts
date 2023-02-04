import { startClient } from "../../utils/rpc/client-utils";
import { env } from "../env";

const isProd = env.NODE_ENV === "production";
console.log(`[port] ${isProd ? "prod" : "dev"} mode`);
const WorkerCtor = isProd ? SharedWorker : Worker;
const worker = new WorkerCtor("./worker.js");
export const port = startClient(worker);
