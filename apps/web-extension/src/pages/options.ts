import { downloadFile } from "../utils/download-file";
import "./options.css";
export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
  const menu = document.querySelector("menu")!;

  menu.addEventListener("click", (e) => {
    const action = (e.target as HTMLElement)?.closest("[data-action]")?.getAttribute("data-action");
    switch (action) {
      case "download":
        worker.postMessage({ name: "request-download" });
        break;
      case "clear":
        worker.postMessage({ name: "request-clear" });
        break;
      case "reset":
        worker.postMessage({ name: "request-reset" });
        break;
    }
  });

  worker.addEventListener("message", async (msg) => {
    if (msg.data?.name === "file-download-ready") {
      downloadFile(msg.data.file);
    }
  });
}

main();
