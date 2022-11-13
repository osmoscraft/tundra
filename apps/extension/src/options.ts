import { createWorker, startWorker } from "./features/worker";

export async function main() {
  const worker = await startWorker(createWorker());
}

main();
