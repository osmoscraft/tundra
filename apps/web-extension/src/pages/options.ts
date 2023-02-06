import type { MessageToMain, RequestClear, RequestDownload, RequestReset } from "../typings/messages";
import { downloadFile } from "../utils/download-file";
import { postMessage } from "../utils/post-message";
import "./options.css";
export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const menu = document.querySelector("menu")!;

  menu.addEventListener("click", (e) => {
    const action = (e.target as HTMLElement)?.closest("[data-action]")?.getAttribute("data-action");
    switch (action) {
      case "download":
        postMessage<RequestDownload>(worker, { name: "request-download" });
        break;
      case "clear":
        postMessage<RequestClear>(worker, { name: "request-clear" });
        break;
      case "reset":
        postMessage<RequestReset>(worker, { name: "request-reset" });
        break;
    }
  });

  worker.addEventListener("message", async (event: MessageEvent<MessageToMain>) => {
    if (event.data?.name === "file-download-ready") {
      downloadFile(event.data.file);
    }
  });
}

main();
