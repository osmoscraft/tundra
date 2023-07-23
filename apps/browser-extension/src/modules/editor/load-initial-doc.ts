import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { EditorView } from "codemirror";
import type { DataWorkerRoutes } from "../../workers/data-worker";

export async function loadInitialDoc(view: EditorView, proxy: AsyncProxy<DataWorkerRoutes>) {
  const searchParams = new URLSearchParams(location.search);
  const isDraft = searchParams.has("draft");
  const path = searchParams.get("path");

  if (isDraft) {
    view.dispatch({
      changes: {
        from: 0,
        insert: `
---
title: New note
---

- New item`.trim(),
      },
    });
    return;
  } else if (path) {
    const file = await proxy.getFile(path);
    if (!file) return;
    view.dispatch({
      changes: {
        from: 0,
        insert: file.content ?? "",
      },
    });
  }
}
