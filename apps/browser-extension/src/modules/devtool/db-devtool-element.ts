import { attachShadowHtml } from "@tinykb/dom-utils";
import { getDbWorkerProxy } from "../../db-worker-proxy";
import template from "./db-devtool-element.html";
import { downloadFile } from "./download-file";

export class DbDevtoolElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private menu = this.shadowRoot.querySelector("menu")!;

  connectedCallback() {
    this.menu.addEventListener("click", async (e) => {
      const dbWorker = getDbWorkerProxy();

      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "check-health": {
          dbWorker.request({ requestCheckHealth: true }).then(console.log);
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
      }
    });
  }
}
