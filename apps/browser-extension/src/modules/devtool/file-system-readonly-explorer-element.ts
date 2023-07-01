import { attachShadowHtml } from "@tinykb/dom-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import template from "./file-system-readonly-explorer-element.html";

export class FileSystemReadonlyExplorerElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  shadowRoot = attachShadowHtml(template, this);
  private fileList = this.shadowRoot.querySelector("ul")!;
  private code = this.shadowRoot.querySelector("code")!;
  private proxy = FileSystemReadonlyExplorerElement.dependencies.proxy;

  connectedCallback() {
    this.proxy.getRecentFiles().then((fileList) => {
      this.fileList.innerHTML = (fileList ?? [])
        .map((item) => `<li><button data-path="${item.path}">${item.meta?.title}</button></li>`)
        .join("");

      if (!fileList?.length) {
        this.fileList.innerHTML = `<div class="empty-placeholder">Empty</dvi>`;
      }
    });

    this.fileList.addEventListener("click", async (e) => {
      const path = (e.target as HTMLElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;

      const file = await this.proxy.getFile(path);
      this.code.innerHTML = file?.content ?? "Error: File does not exist";
    });
  }
}
