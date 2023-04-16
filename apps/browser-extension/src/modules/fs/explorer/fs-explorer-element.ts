import { attachShadowHtml } from "@tinykb/dom-utils";
import { getDbWorkerProxy } from "../../../db-worker-proxy";
import template from "./fs-explorer-element.html";

export class FsExplorerElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private fileList = this.shadowRoot.querySelector("ul")!;
  private code = this.shadowRoot.querySelector("code")!;
  private worker = getDbWorkerProxy();

  connectedCallback() {
    this.worker.request({ requestFileList: true }).then(({ respondFileList }) => {
      this.fileList.innerHTML =
        respondFileList?.map((item) => `<li><button data-path="${item.path}">${item.path}</button></li>`).join("") ??
        "Empty";
    });

    this.fileList.addEventListener("click", async (e) => {
      const path = (e.target as HTMLElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;

      const { respondFileByPath } = await this.worker.request({ requestFileByPath: path });
      this.code.innerHTML = respondFileByPath?.content ?? "Error: File does not exist";
    });
  }
}
