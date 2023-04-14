import { preloadDbWorker } from "./modules/db/proxy";
import { EditorElement } from "./modules/edit/editor-element";

preloadDbWorker();

customElements.define("editor-element", EditorElement);
