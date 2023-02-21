import { connectionToForm, formToConnection, getConnection, saveConnection } from "../modules/git/connection";
import type {
  MessageToMain,
  RequestClear,
  RequestClone,
  RequestDownload,
  RequestReset,
  RequestSync,
  RequestTestConnection,
} from "../typings/messages";
import { downloadFile } from "../utils/download-file";
import { postMessage } from "../utils/post-message";

import "./options.css";

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const form = document.querySelector("form")!;

  form.addEventListener("click", (e) => {
    const action = (e.target as HTMLElement)?.closest("[data-action]")?.getAttribute("data-action");
    if (action) e.preventDefault();

    switch (action) {
      case "download": {
        postMessage<RequestDownload>(worker, { name: "request-download" });
        break;
      }
      case "clear": {
        postMessage<RequestClear>(worker, { name: "request-clear" });
        break;
      }
      case "clone": {
        const connection = getConnection();
        if (!connection) return;
        postMessage<RequestClone>(worker, { name: "request-clone", connection });
        break;
      }
      case "reset": {
        postMessage<RequestReset>(worker, { name: "request-reset" });
        break;
      }
      case "save-connection": {
        if (!form.reportValidity()) return;
        saveConnection(formToConnection(form));
        break;
      }
      case "sync": {
        const connection = getConnection();
        if (!connection) return;
        postMessage<RequestSync>(worker, { name: "request-sync", connection });
        break;
      }
      case "test-connection": {
        if (!form.reportValidity()) return;
        const connection = formToConnection(form);
        postMessage<RequestTestConnection>(worker, { name: "request-test-connection", connection });
        break;
      }
    }
  });

  connectionToForm(getConnection() || {}, form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  worker.addEventListener("message", async (event: MessageEvent<MessageToMain>) => {
    if (event.data?.name === "file-download-ready") {
      downloadFile(event.data.file);
    }
  });
}

main();
