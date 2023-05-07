import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../workers/data-worker";

const worker = new Worker("./data-worker.js", { type: "module" });

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });
