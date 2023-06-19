import type { KeyBinding } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import type { DialogElement } from "../../shell/dialog-element";
import { openCommandPalette, save } from "../editor";

export const omniboxKeymap: (dialog: DialogElement, proxy: AsyncProxy<DataWorkerRoutes>) => KeyBinding[] = (
  dialog,
  proxy
) => [
  {
    key: "Mod-Space",
    preventDefault: true,
    run() {
      openCommandPalette(dialog, proxy);
      return true;
    },
  },
  {
    key: "Mod-s",
    preventDefault: true,
    run(view) {
      save(() => view.state.doc.toString(), proxy);
      return true;
    },
  },
  {
    key: "Mod-S",
    preventDefault: true,
    run(view) {
      save(() => view.state.doc.toString(), proxy)
        .then(() => proxy.pull())
        .then(() => proxy.push());
      return true;
    },
  },
];
