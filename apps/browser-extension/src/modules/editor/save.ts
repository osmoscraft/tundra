import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";

export async function save(getContent: () => string, proxy: AsyncProxy<DataWorkerRoutes>) {
  const searchParams = new URLSearchParams(location.search);
  const path = searchParams.get("path");
  if (!path) throw new Error("Path is required for saving");

  await proxy.writeFile(path, getContent());
}
