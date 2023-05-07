import { client, dedicatedWorkerHostPort } from "rpc-utils";
import type { DataWorkerRoutes } from "../workers/data-worker";

performance.mark("start");
const worker = new Worker("./data-worker.js", { type: "module" });
console.log("[client] worker instantiated");

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

console.log("[client] will ping server");
proxy.ping().then((e) => console.log(`${performance.measure("e", "start").duration.toFixed(2)} ms`, e));
