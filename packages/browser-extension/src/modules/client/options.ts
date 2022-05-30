const bc = new BroadcastChannel("shared-channel");
const worker = new SharedWorker("./modules/server/worker.js", { name: "tinykb-worker" });

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

window.addEventListener("click", (e) => {
  const actionTrigger = (e.target as HTMLElement)?.closest("[data-action]");
  switch (actionTrigger?.getAttribute("data-action")) {
    case "inspect-worker":
      chrome.tabs.create({
        url: "chrome://inspect/#workers",
      });
      break;
  }
});

export default {};
