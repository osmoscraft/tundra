import "./popup.css";

export default async function main() {
  // const workerPromise = (self as any).sqlite3Worker1Promiser({
  //   onready: async (e: any) => {
  //     console.log("worker ready", e);
  //     const openResult = await workerPromise({ type: "open", args: { filename: "/mydb.sqlite3" } });
  //     console.log(openResult.result);

  //     const event = await workerPromise("exec", {
  //       sql: "CREATE TABLE IF NOT EXISTS t(a,b)",
  //     });

  //     console.log(event.result);

  //     const event2 = await workerPromise("exec", {
  //       sql: "SELECT a FROM t ORDER BY a LIMIT 10",
  //       resultRows: [],
  //       columnNames: [],
  //     });

  //     console.log(event2.result);
  //   },
  // });
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
