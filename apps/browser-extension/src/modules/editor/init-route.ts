import { Transaction } from "@codemirror/state";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { resolveSearchParams } from "../router/resolve-search-params";
import { paramsToRouteState, replaceSearchParams } from "../router/route-state";
import type { BacklinksElement } from "./menus/backlinks-element";
import type { HudElement } from "./status/hud-element";

export interface LoadRouteDataConfig {
  proxy: AsyncProxy<DataWorkerRoutes>;
  hud: HudElement;
  backlinks: BacklinksElement;
  editorView: EditorView;
  url: string;
  setBufferChangeBase: (value: string) => void;
}
export async function initRoute({ proxy, backlinks, hud, editorView, url, setBufferChangeBase }: LoadRouteDataConfig) {
  const resolvedSearchParams = await resolveSearchParams({ proxy, searchParams: new URL(url).searchParams });
  replaceSearchParams(resolvedSearchParams);
  const state = paramsToRouteState(resolvedSearchParams);
  const { id, title, url: metaUrl } = state;

  const file = id ? await proxy.getNote(id) : null;

  hud.setIsExisting(!!file);
  const initialContent = file?.content ?? getDraftContent(title, metaUrl);

  editorView.dispatch({
    annotations: Transaction.addToHistory.of(false), // do not track programatic update as history
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: initialContent,
    },
  });

  setBufferChangeBase(editorView.state.doc.toString());

  if (!id) {
    backlinks.setBacklinks([]);
  } else {
    proxy.getBacklinks(id).then((links) => {
      backlinks.setBacklinks(links);
    });
  }
}

function getDraftContent(title?: string, metaUrl?: string) {
  return `
---
${[
  `title: ${title ?? "Untitled"}`,
  `created: ${new Date().toISOString().split("T")[0]}`,
  metaUrl ? `url: ${metaUrl}` : ``,
]
  .filter(Boolean)
  .join("\n")}
---

`.trimStart();
}
