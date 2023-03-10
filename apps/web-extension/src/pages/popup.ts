import { CaptureFormElement } from "../modules/capture/capture-form-element";
import "./popup.css";

customElements.define("capture-form-element", CaptureFormElement);

export default async function main() {
  const worker = new Worker("./worker.js", { type: "module" });
}

main();
