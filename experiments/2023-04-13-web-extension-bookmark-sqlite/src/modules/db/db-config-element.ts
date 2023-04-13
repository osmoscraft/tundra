import type { MessageToMainV2, MessageToWorkerV2 } from "../../typings/messages";
import { attachShadowHtml } from "../../utils/dom";
import { downloadFile } from "../../utils/download-file";
import { loadWorker } from "../worker/load-worker";
import { getNotifier, getRequester } from "../worker/notify";
import template from "./db-config-element.html";

export class DbConfigElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private menu = this.shadowRoot.querySelector("menu")!;
  private worker = loadWorker();
  private status = this.shadowRoot.querySelector("#status")!;
  private notifyWorker = getNotifier<MessageToWorkerV2>(this.worker);
  private requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(this.worker);

  connectedCallback() {
    this.form.addEventListener("submit", (e) => e.preventDefault());
    this.worker.addEventListener("message", (e) => {
      const data = e.data as MessageToMainV2;
    });

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "clear": {
          this.notifyWorker({ requestDbClear: true });
          break;
        }

        case "download": {
          const { respondDbDownload } = await this.requestWorker({ requestDbDownload: true });
          if (respondDbDownload) {
            downloadFile(respondDbDownload);
          }
          break;
        }

        case "nuke": {
          this.notifyWorker({ requestDbNuke: true });
          break;
        }
      }
    });
  }
}
