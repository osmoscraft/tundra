import { getDbWorker } from "./modules/db/get-db-worker";
import { EditorElement } from "./modules/edit/editor-element";

getDbWorker();

customElements.define("editor-element", EditorElement);
