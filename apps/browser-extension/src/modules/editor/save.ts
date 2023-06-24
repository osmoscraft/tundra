import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { timestampToNotePath } from "../sync/path";

export async function save(getContent: () => string, proxy: AsyncProxy<DataWorkerRoutes>) {
  const path = new URLSearchParams(location.search).get("path");
  if (!path) {
    // save new draft
    const path = timestampToNotePath(new Date());

    await proxy.writeFile(path, getContent());
    const mutableUrl = new URL(location.href);
    mutableUrl.searchParams.set("path", path);
    history.replaceState(null, "", mutableUrl.toString());
  } else {
    // update existing file
    await proxy.writeFile(path, getContent());
  }
}
