import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";

export async function loadInitialDoc(view: EditorView, proxy: AsyncProxy<DataWorkerRoutes>) {
  const path = new URLSearchParams(location.search).get("path");
  if (!path) {
    view.dispatch({
      changes: {
        from: 0,
        insert: `---
title: "New note"
---

- New item`,
      },
    });
    return;
  }
  const file = await proxy.getFile(path);
  if (!file) return;

  view.dispatch({
    changes: {
      from: 0,
      insert: file.content ?? "",
    },
  });
}
