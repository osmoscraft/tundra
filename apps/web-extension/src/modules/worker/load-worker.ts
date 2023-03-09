let instance: Worker | null;
export function loadWorker() {
  if (instance) return instance;
  instance = new Worker("./worker.js", { type: "module" });

  return instance;
}
