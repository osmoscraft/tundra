import { dedicatedWorkerPort, server } from "rpc-utils";

export type DataWorkerRoutes = typeof routes;

const routes = {
  ping: () => "pong",
};

console.log("will attach server");
server({ routes, port: dedicatedWorkerPort(self as DedicatedWorkerGlobalScope) });

console.log("[data worker] online");
