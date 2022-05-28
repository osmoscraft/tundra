/// <reference lib="WebWorker" />

// TODO remove when there is any import
export type {};
const ports: MessagePort[] = [];
const bc = new BroadcastChannel("shared-channel");

declare const self: SharedWorkerGlobalScope;

const ab = new Array(10000).fill("x");

self.addEventListener("connect", (connectEvent) => {
  const port = connectEvent.ports[0];
  ports.push(port);
  console.log(`New connection, total = ${ports.length}`);

  // start receiving
  port.start();

  port.addEventListener("message", () => {
    port.postMessage(ab);
    bc.postMessage(ab);
  });
});
