import type { MessageToDbWorker, MessageToMain } from "../../../typings/messages";
import { request } from "../../rpc/notify";
import { getDbWorker } from "../get-instance";
import "./db-devtool-element.css";
import template from "./db-devtool-element.html";
import { downloadFile } from "./download-file";

export class DbDevtoolElement extends HTMLElement {
  constructor(public innerHTML = template) {
    super();
  }

  connectedCallback() {
    const menu = this.querySelector("menu")!;

    menu.addEventListener("click", async (e) => {
      const dbWorkerPromise = getDbWorker();

      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "download": {
          request<MessageToDbWorker, MessageToMain>(await dbWorkerPromise, { requestDbDownload: true }).then(
            ({ respondDbDownload }) => {
              if (respondDbDownload) {
                downloadFile(respondDbDownload);
              }
            }
          );
          break;
        }

        case "destroy": {
          request<MessageToDbWorker, MessageToMain>(await dbWorkerPromise, { requestDbDestroy: true }).then(
            (response) => {
              if (response.respondDbDestroy) location.reload();
            }
          );
          break;
        }
      }
    });
  }
}
