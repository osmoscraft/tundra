import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";

export async function deleteCurrentNote(proxy: AsyncProxy<DataWorkerRoutes>) {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  if (!id) throw new Error("id is required for deleting");

  await proxy.deleteNote(id);
}
