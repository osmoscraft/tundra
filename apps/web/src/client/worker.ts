import { ProxyClient } from "utils";
import type { AppRoutes } from "../routes";
import { logError } from "./log";

const workerPromise = import.meta.env.PROD ? import("../server?sharedworker") : import("../server?worker");
const proxyPromise = workerPromise.then(async (worker) => {
  const proxy = new ProxyClient<AppRoutes>(new worker.default());
  proxy.start();

  // ensure server is ready by testing with echo
  const res = await proxy.request("echo", { message: "ping" });
  if (res.message !== "ping") logError("Backend worker failed to respond");

  return proxy;
});

export const request: ProxyClient<AppRoutes>["request"] = (async (
  ...args: Parameters<ProxyClient<AppRoutes>["request"]>
) => {
  return (await proxyPromise).request(...args);
}) as any;
