import "./popup.css";

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
}

main();
