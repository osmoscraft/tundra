import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import "./file-system-readonly-explorer-element.css";
import template from "./file-system-readonly-explorer-element.html";

export class FileSystemReadonlyExplorerElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  private fileList: HTMLUListElement;
  private code: HTMLElement;
  private proxy = FileSystemReadonlyExplorerElement.dependencies.proxy;

  constructor() {
    super();
    this.innerHTML = template;
    this.fileList = this.querySelector("ul")!;
    this.code = this.querySelector("code")!;
  }

  connectedCallback() {
    this.proxy.getRecentFiles().then((fileList) => {
      this.fileList.innerHTML = (fileList ?? [])
        .map((item) => `<li><button data-path="${item.path}">${item.path}</button></li>`)
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
