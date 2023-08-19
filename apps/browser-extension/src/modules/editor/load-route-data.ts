import { Transaction } from "@codemirror/state";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { paramsToRouteState } from "../router/route-state";
import { timestampToId } from "../sync/path";
import type { BacklinksElement } from "./menus/backlinks-element";

export interface LoadRouteDataConfig {
  proxy: AsyncProxy<DataWorkerRoutes>;
  backlinks: BacklinksElement;
  editorView: EditorView;
}
export async function loadRouteData({ proxy, backlinks, editorView }: LoadRouteDataConfig) {
  const mutableSearchParams = new URLSearchParams(location.search);

  // convert url to id
  if (mutableSearchParams.has("url")) {
    const url = mutableSearchParams.get("url")!;
    const note = await proxy.getNoteByUrl(url);
    if (note) {
      mutableSearchParams.set("id", note.id);
      mutableSearchParams.delete("url");
      window.history.replaceState(null, "", `${location.pathname}?${mutableSearchParams}`);
    }
  }

  // ensure URL has id
  if (!mutableSearchParams.get("id")) {
    mutableSearchParams.set("id", timestampToId(new Date()));
    window.history.replaceState(null, "", `${location.pathname}?${mutableSearchParams}`);
  }

  const state = paramsToRouteState(mutableSearchParams);
  const { id, title, url } = state;

  const file = id ? await proxy.getNote(id) : null;

  editorView.dispatch({
    annotations: Transaction.addToHistory.of(false), // do not track programatic update as history
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: file?.content ?? getDraftContent(title, url),
    },
  });

  if (!id) {
    backlinks.setBacklinks([]);
  } else {
    proxy.getBacklinks(id).then((links) => {
      backlinks.setBacklinks(links);
    });
  }
}

function getDraftContent(title?: string, url?: string) {
  return `
---
${[`title: ${title ?? "Untitled"}`, `created: ${new Date().toISOString().split("T")[0]}`, url ? `url: ${url}` : ``]
  .filter(Boolean)
  .join("\n")}
---

- New item`.trim();
}
