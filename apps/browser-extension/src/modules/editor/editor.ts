import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { OmniboxElement } from "../omnibox/omnibox-element";
import type { DialogElement } from "../shell/dialog-element";
import { timestampToNotePath } from "../sync/path";

export async function openCommandPalette(dialog: DialogElement, proxy: AsyncProxy<DataWorkerRoutes>) {
  const omnibox = document.createElement("omnibox-element") as OmniboxElement;

  omnibox.addEventListener("omnibox-load-default", async () => {
    const files = await proxy.getRecentFiles();
    omnibox.setSuggestions(files.map((file) => ({ path: file.path, title: file.path })));
  });

  omnibox.addEventListener("omnibox-input", async (e) => {
    performance.mark("search-start");
    const searchResults = await proxy.search({ query: e.detail, limit: 10 });
    omnibox.setSuggestions(searchResults.map((result) => ({ path: result.node.path, title: result.node.title })));
    console.log(`[perf] search latency ${performance.measure("search", "search-start").duration.toFixed(2)}ms`);
  });

  dialog.setContentElement(omnibox);
}

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
