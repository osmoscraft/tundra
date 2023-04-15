import { preloadDbWorker } from "./db-worker-proxy";
import { EditorElement } from "./modules/edit/editor-element";

preloadDbWorker();

customElements.define("editor-element", EditorElement);
