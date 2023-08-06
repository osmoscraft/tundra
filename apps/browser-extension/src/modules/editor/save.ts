import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { noteIdToPath } from "../sync/path";

export async function save(getContent: () => string, proxy: AsyncProxy<DataWorkerRoutes>) {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  if (!id) throw new Error("id is required for saving");

  const path = noteIdToPath(id);
  await proxy.writeFile(path, getContent());
}
