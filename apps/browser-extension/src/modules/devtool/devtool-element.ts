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
    if (new URLSearchParams(location.search).get("checkhealth") === "true") {
      this.proxy.checkHealth();
    }

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "check-health": {
          this.proxy.checkHealth();
          break;
        }
        case "download-db-file": {
          const file = await this.proxy.getDbFile();
          downloadFile(file);
          break;
        }
        case "destory-data": {
          this.proxy.destoryData();
          break;
        }
        case "destory-all": {
          this.proxy.destoryAll();
          break;
        }
      }
    });
  }
}
