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
  const { id, title } = state;

  const file = id ? await proxy.getNote(id) : null;
  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: file?.content ?? getDraftContent(title),
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

function getDraftContent(title?: string) {
  return `
---
title: ${title ?? "Untitled"}
---

- New item`.trim();
}
