import { Transaction } from "@codemirror/state";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { paramsToRouteState } from "../router/route-state";
import type { BacklinksElement } from "./menus/backlinks-element";

export interface RouteContentConfig {
  proxy: AsyncProxy<DataWorkerRoutes>;
  backlinks: BacklinksElement;
  editorView: EditorView;
}
export async function handleUpdate({ proxy, backlinks, editorView }: RouteContentConfig) {
  const searchParams = new URLSearchParams(location.search);
  const state = paramsToRouteState(searchParams);
  const { id, title, url } = state;

  let file = url ? await proxy.getNoteByUrl(url) : null;
  file ??= id ? await proxy.getNote(id) : null;

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
