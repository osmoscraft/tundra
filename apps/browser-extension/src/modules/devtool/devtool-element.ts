import { attachShadowHtml } from "@tinykb/dom-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import template from "./devtool-element.html";
import { downloadFile } from "./download-file";

export class DevtoolElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  shadowRoot = attachShadowHtml(template, this);
  private menu = this.shadowRoot.querySelector("menu")!;
  private proxy = DevtoolElement.dependencies.proxy;

  connectedCallback() {
    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "check-health": {
          this.proxy.checkHealth();
          break;
        }
        case "clear-files": {
          this.proxy.clearFiles();
          break;
        }
        case "download-fs-db": {
          const file = await this.proxy.getFsDbFile();
          downloadFile(file);
          break;
        }
        case "download-sync-db": {
          const file = await this.proxy.getSyncDbFile();
          downloadFile(file);
          break;
        }
        case "rebuild": {
          this.proxy.rebuild();
        }
      }
    });
  }
}
