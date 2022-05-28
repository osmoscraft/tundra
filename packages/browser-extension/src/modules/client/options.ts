const bc = new BroadcastChannel("shared-channel");
const worker = new SharedWorker("./modules/service/worker.js", { name: "shared-worker" });

let start = 0;

worker.port.addEventListener("message", (message) => {
  const d = performance.now() - start;
  console.log(`s-worker ${d}`, message.data);
});

bc.addEventListener("message", (message) => {
  const d = performance.now() - start;
  console.log(`bc ${d}`, message.data);
});

worker.port.start();

document.querySelector<HTMLButtonElement>(`button[data-input='ping']`)!.onclick = () => {
  start = performance.now();
  worker.port.postMessage("ping");
};

export default {};
