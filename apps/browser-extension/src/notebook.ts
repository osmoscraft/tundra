import { EditorElement } from "./modules/edit/editor-element";
import { loadWorker } from "./modules/rpc/create-worker";
import "./notebook.css";

const worker = loadWorker("./sqlite-worker.js");

customElements.define("editor-element", EditorElement);

console.log("hello notebook");
