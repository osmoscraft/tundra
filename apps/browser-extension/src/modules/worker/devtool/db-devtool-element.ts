import { getDbWorkerProxy } from "../../../db-worker-proxy";
import { attachShadowHtml } from "../../dom/shadow";
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
        case "download": {
          dbWorker.request({ requestDbDownload: true }).then(({ respondDbDownload }) => {
            if (respondDbDownload) {
              downloadFile(respondDbDownload);
            }
          });
          break;
        }

        case "destroy": {
          dbWorker.request({ requestDbDestroy: true }).then((response) => {
            if (response.respondDbDestroy) location.reload();
          });
          break;
        }
      }
    });
  }
}
