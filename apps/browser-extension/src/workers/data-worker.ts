import { dedicatedWorkerPort, server } from "@tinykb/rpc-utils";

export type DataWorkerRoutes = typeof routes;

const routes = {};

console.log("will attach server");
server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
