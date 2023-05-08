import { attachShadowHtml, getCombo } from "@tinykb/dom-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import template from "./file-system-explorer-element.html";

export class FileSystemExplorerElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  shadowRoot = attachShadowHtml(template, this);
  private fileList = this.shadowRoot.querySelector("ul")!;
  private code = this.shadowRoot.querySelector("code")!;

  connectedCallback() {
    const { proxy } = FileSystemExplorerElement.dependencies;
    proxy.listFiles().then((files) => {
      this.fileList.innerHTML = (files ?? [])
        .map((item) => `<li><a href="?path=${encodeURIComponent(item.path)}">${item.path}</a></li>`)
        .join("");

      if (!files?.length) {
        this.fileList.innerHTML = `<div class="empty-placeholder">Empty</dvi>`;
      }
    });

    this.loadNoteFromUrl(proxy);

    this.code.addEventListener("keydown", async (e) => {
      switch (getCombo(e)) {
        case "ctrl+s": {
          e.preventDefault();
          const newContent = this.code.innerText;
          const path = new URLSearchParams(location.search).get("path");
          if (!path) break;
          proxy.writeFile(path, newContent);
          break;
        }
      }
    });
  }

  private async loadNoteFromUrl(proxy: AsyncProxy<DataWorkerRoutes>) {
    const path = new URLSearchParams(location.search).get("path");
    if (!path) return;
    const file = await proxy.getFile(path);
    this.code.innerHTML = file?.content ?? "Error: File does not exist";
  }
}
