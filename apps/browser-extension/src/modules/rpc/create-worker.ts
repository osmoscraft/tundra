let instance: Worker | null;
export function loadWorker(path: string) {
  if (instance) return instance;
  instance = new Worker(path, { type: "module" });

  return instance;
}
