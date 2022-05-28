const worker = new SharedWorker("./modules/service/worker.js", { name: "shared-worker" });
console.log("hello popup");

worker.port.addEventListener("message", (message) => console.log(message));

worker.port.start();

export default {};
