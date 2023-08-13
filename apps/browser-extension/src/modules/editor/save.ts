import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";

export async function saveCurrentNote(getContent: () => string, proxy: AsyncProxy<DataWorkerRoutes>) {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  if (!id) throw new Error("id is required for saving");

  await proxy.writeNote(id, getContent());
}
