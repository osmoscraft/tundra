import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { timestampToId } from "../sync/path";

export interface GetRouteStateConfig {
  proxy: AsyncProxy<DataWorkerRoutes>;
  searchParams: URLSearchParams;
}
export async function resolveSearchParams({ proxy, searchParams }: GetRouteStateConfig): Promise<URLSearchParams> {
  const mutableSearchParams = new URLSearchParams(searchParams);

  // convert url to id
  if (mutableSearchParams.has("url")) {
    const url = mutableSearchParams.get("url")!;
    const note = await proxy.getNoteByUrl(url);
    if (note) {
      mutableSearchParams.set("id", note.id);
      mutableSearchParams.delete("url");
    }
  }

  // ensure URL has id
  if (!mutableSearchParams.get("id")) {
    mutableSearchParams.set("id", timestampToId(new Date()));
  }

  return mutableSearchParams;
}
