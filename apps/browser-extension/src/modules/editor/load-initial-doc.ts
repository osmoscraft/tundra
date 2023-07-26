import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import { paramsToRouteState } from "../router/route-state";

export async function loadInitialDoc(view: EditorView, proxy: AsyncProxy<DataWorkerRoutes>) {
  const searchParams = new URLSearchParams(location.search);
  const state = paramsToRouteState(searchParams);
  const { path, title } = state;

  const file = path ? await proxy.getFile(path) : null;
  view.dispatch({
    changes: {
      from: 0,
      insert: file?.content ?? getDraftContent(title),
    },
  });
}

const getDraftContent = (title?: string) =>
  `
---
title: ${title ?? "Untitled"}
---

- New item`.trim();
