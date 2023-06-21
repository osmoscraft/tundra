import type { KeyBinding } from "@codemirror/view";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import type { OmniboxElement } from "../../omnibox/omnibox-element";
import { save } from "../editor";

export const omniboxKeymap: (omnibox: OmniboxElement, proxy: AsyncProxy<DataWorkerRoutes>) => KeyBinding[] = (
  omnibox,
  proxy
) => [
  {
    key: "Mod-Space",
    preventDefault: true,
    run() {
      omnibox.focus();
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
