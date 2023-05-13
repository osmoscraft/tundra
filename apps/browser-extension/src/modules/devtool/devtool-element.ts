import { attachShadowHtml } from "@tinykb/dom-utils";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import { getDbWorkerProxy } from "../../db-worker-proxy";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import template from "./devtool-element.html";
import { downloadFile } from "./download-file";

export class DevtoolElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  shadowRoot = attachShadowHtml(template, this);
  private menu = this.shadowRoot.querySelector("menu")!;

  connectedCallback() {
    const { proxy } = DevtoolElement.dependencies;
    this.menu.addEventListener("click", async (e) => {
      const dbWorker = getDbWorkerProxy();

      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "check-health": {
          proxy.checkHealth();
          break;
        }
        case "clear-files": {
          proxy.clearFiles();
          break;
        }
        case "download-fs": {
          dbWorker.request({ requestDbExport: "fs" }).then(({ respondDbExport: respondDbDownload }) => {
            if (respondDbDownload) {
              downloadFile(respondDbDownload);
            }
          });
          break;
        }
        case "download-fs-db": {
          const file = await proxy.getFsDbFile();
          downloadFile(file);
          break;
        }
        case "download-sync": {
          dbWorker.request({ requestDbExport: "sync" }).then(({ respondDbExport: respondDbDownload }) => {
            if (respondDbDownload) {
              downloadFile(respondDbDownload);
            }
          });
          break;
        }

        case "clear-all": {
          dbWorker.request({ requestDbClear: ["fs", "sync"] });
          break;
        }

        case "destroy-all": {
          dbWorker.request({ requestDbDestory: ["fs", "sync"] }).then((response) => {
            if (response.respondDbDestroy) location.reload();
          });
          break;
        }

        case "destroy-fs": {
          dbWorker.request({ requestDbDestory: ["fs"] }).then((response) => {
            if (response.respondDbDestroy) location.reload();
          });
          break;
        }

        case "rebuild": {
          proxy.rebuild();
        }
      }
    });
  }
}
