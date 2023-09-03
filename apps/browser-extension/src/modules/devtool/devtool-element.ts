import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import template from "./devtool-element.html";
import { downloadFile } from "./download-file";

export class DevtoolElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  private menu: HTMLMenuElement;
  private proxy = DevtoolElement.dependencies.proxy;

  constructor() {
    super();
    this.innerHTML = template;
    this.menu = this.querySelector("menu")!;
  }

  connectedCallback() {
    if (new URLSearchParams(location.search).get("checkhealth") === "true") {
      this.proxy.checkHealth();
    }

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "check-health": {
          // set checkhealth=true in the url to check health
          location.search = new URLSearchParams({ checkhealth: "true" }).toString();
          break;
        }
        case "download-db-file": {
          const file = await this.proxy.getDbFile();
          downloadFile(file);
          break;
        }
        case "destory-all": {
          this.proxy.destoryDatabase();
          location.reload();
          break;
        }
      }
    });
  }
}
