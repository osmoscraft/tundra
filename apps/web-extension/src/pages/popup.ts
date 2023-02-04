import "./popup.css";

export default async function main() {
  const worker = new Worker("./worker.js?sqlite3.dir=sqlite3");

  document.querySelector("#download")!.addEventListener("click", () => {
    worker.postMessage({ name: "request-download" });
  });

  document.querySelector("#reset")!.addEventListener("click", () => {
    worker.postMessage({ name: "request-reset" });
  });

  worker.addEventListener("message", async (msg) => {
    if (msg.data?.name === "file-download-ready") {
      const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker({
        suggestedName: "debug.db",
      });
      const writable = await (handle as any).createWritable();
      await writable.write(msg.data.file);
      await writable.close();
    }
  });
}

main();
