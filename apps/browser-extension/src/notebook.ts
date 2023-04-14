import { getDbWorker } from "./modules/db/get-instance";
import { EditorElement } from "./modules/edit/editor-element";
import "./notebook.css";

getDbWorker();

customElements.define("editor-element", EditorElement);

console.log("hello notebook");
