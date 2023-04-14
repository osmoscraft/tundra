let instance: Worker;
export function getDbWorker() {
  instance ??= new Worker("./db-worker.js", { type: "module" });
  return instance;
}
